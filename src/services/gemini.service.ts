/**
 * Google Gemini Cloud Service — src/services/gemini.service.ts
 *
 * Provides direct AI-powered conversational grievance triage using
 * Google Gemini 1.5/2.x/3.x Flash models via Google AI REST API.
 *
 * Automatically extracts NEHU-specific categories, subcategories,
 * campus locations (like SoT, Hostels, Library), and synthesizes
 * official grievance drafts directly from natural student conversation.
 */

import { logger } from '@/utils/logger.utils';
import type { ChatMessage, DraftIssue } from '@/types/api.types';
import { CATEGORY_IDS, type CategoryId } from '@/constants/categories';
import { NEHU_LOCATIONS_BY_CATEGORY } from '@/services/location.service';

export interface GeminiGrievanceResult {
  replyText: string;
  category: CategoryId;
  subcategory?: string;
  location?: string;
  complete: boolean;
  draft: DraftIssue | null;
}

const CANDIDATE_MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
] as const;

const GEMINI_REQUEST_TIMEOUT_MS = 4500;
const MAX_CONTEXT_MESSAGES = 4;

const SYSTEM_PROMPT = `You are the AI Grievance Redressal Assistant for North-Eastern Hill University (NEHU), Shillong Campus. Extract the issue, category, subcategory, and official NEHU Shillong location from informal English or Hindi-English text, and draft a formal report.

Exact Categories (use exact UUID as "category") & Subcategories (use exact UUID as "subcategory"):
1. Hostel and Residential ("64186f49-bf76-4389-869a-323895980286"):
   - "5b267187-0ec3-4dea-9e07-98ad2430e81a": Mess Food & Hygiene
   - "0bc346d3-716a-4fac-80a7-ce7d29836fbd": Maintenance & Hostel Wi-Fi
   - "9fdcd1a9-efad-49c9-9552-6f8511548d45": Room Allotment & Cleanliness
   - "ebddeedf-57b5-45cd-8de5-5c31a849cb3d": Safety & Security
2. Academic and Department ("84c22147-f812-422f-9980-04ca4d8eb17a"):
   - "255eefd1-3f22-49af-992b-a15d061a3242": Department Labs & Academic Wi-Fi
   - "f50e2f36-590f-44b7-8873-b97768dd80c2": Timetable & Attendance
   - "578f6b1c-1a40-4ac0-bdb2-c016188ba8d8": Exams, Results & Evaluation
   - "a80492c3-880b-4a4f-83ac-6519f6d78699": Faculty & Staff Conduct
3. Campus and Facilities (Central Level) ("4656baec-49de-4563-ae62-6c8e5b1fd3b6"):
   - "4645ebbb-dbfb-44ce-9c47-44930f63cbee": Central IT & Escalations
   - "f6b32c0e-7fce-4414-81c0-62207dc21beb": Hygiene & Sanitation
   - "1fa23ab6-e6cf-4cc8-8062-ed83ad3bab7c": Canteen & Cafeteria
   - "c4486d91-dacc-43e7-8ba5-1275d6078808": Transport & Parking
4. Library and Research Facilities ("84d9ca84-af7f-4676-869a-fbdc728a8b98"):
   - "53fa3e88-086f-46ed-a87b-5828e3c2691c": Library Wi-Fi & Digital Resources
   - "d69f7cfb-9a56-4336-91c7-44770b2c6154": Book Availability & Circulation
   - "c5369512-4b53-401f-8ca3-7033bca549cf": Reading Room Environment
5. Sports and Gymnasium ("95a4469e-fbc1-4b7b-8886-356dc1738bdf"):
   - "2ca4b831-69d0-43fa-8a7f-b7c051caa36c": Equipment Condition
   - "c20c72ff-c3cb-4ee5-8a41-9eaf1de2dd4b": Timings & Accessibility
   - "cdb4321c-18f9-4f61-be86-f4294d8998ce": Ground/Court Booking

Official NEHU Shillong Locations (you MUST pick an EXACT verbatim string from the matching category below — never invent, shorten, or append floor/room to the location string):
- Hostel and Residential: ${NEHU_LOCATIONS_BY_CATEGORY[CATEGORY_IDS.HOSTEL].join(' | ')}
- Academic and Department: ${NEHU_LOCATIONS_BY_CATEGORY[CATEGORY_IDS.ACADEMIC].join(' | ')}
- Campus and Facilities (Central Level): ${NEHU_LOCATIONS_BY_CATEGORY[CATEGORY_IDS.CAMPUS_FACILITIES].join(' | ')}
- Library and Research Facilities: ${NEHU_LOCATIONS_BY_CATEGORY[CATEGORY_IDS.LIBRARY].join(' | ')}
- Sports and Gymnasium: ${NEHU_LOCATIONS_BY_CATEGORY[CATEGORY_IDS.SPORTS].join(' | ')}

Rules:
1. Be empathetic, polite, and concise.
2. NEVER guess, assume, or invent a location, room/floor number, or extra problem details that the user did not explicitly state.
3. STRICT LOCATION RULE: "location" and "draft.location.label" MUST be copied verbatim from the Official NEHU Shillong Locations list above. Put any floor/wing/room details inside "description" only, NEVER inside "location.label".
4. If the user says something ambiguous (e.g. "SoT" without naming which department, or "hostel" without naming which hostel) or has NOT named a location from the list, set "complete": false, "draft": null, "location": "", and ask them to pick from the matching official locations.
5. If the user has not clearly described what the issue is (e.g. only gave a location or a greeting), set "complete": false, "draft": null, and ask what the problem is.
6. Only when BOTH the issue and an exact official location from the list are clear: synthesize concise title (max 70 chars), formal description using ONLY facts the user stated, exact category UUID, exact subcategory UUID, complete=true, warm 1-sentence replyText.

Respond strictly with valid JSON:
{"replyText":"string","category":"uuid","subcategory":"uuid","location":"string","complete":false,"draft":null}
When complete is true, "draft" must be:
{"title":"string","description":"string","category":"uuid","subcategory":"uuid","location":{"label":"string","latitude":25.6054,"longitude":91.8988,"autoFetched":false}}`;

export const geminiService = {
  /**
   * Check if a Gemini API key is configured
   */
  hasApiKey: (): boolean => {
    const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    return Boolean(key && key.trim().length > 10);
  },

  /**
   * Generate conversational response and structured grievance draft via Gemini
   */
  generateGrievanceTriage: async (
    allMessages: readonly ChatMessage[],
  ): Promise<GeminiGrievanceResult | null> => {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
    if (!apiKey) {
      logger.log('CHATBOT', 'No Gemini API key found in .env; skipping direct Gemini triage');
      return null;
    }

    // Format recent conversation history for Gemini to keep payloads fast
    const contents = allMessages.slice(-MAX_CONTEXT_MESSAGES).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Try primary model, fallback to candidate models if busy
    for (const model of CANDIDATE_MODELS) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), GEMINI_REQUEST_TIMEOUT_MS);

      try {
        logger.log('CHATBOT', `Calling Gemini AI (${model}) for grievance triage...`);

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: SYSTEM_PROMPT }],
            },
            contents,
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.1,
              maxOutputTokens: 220,
            },
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          logger.warn(
            'CHATBOT',
            `Gemini model ${model} HTTP ${response.status}: ${errData?.error?.message || 'Unknown error'}`,
          );
          continue; // Try next candidate model
        }

        const data = await response.json();
        const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawJsonText) {
          logger.warn('CHATBOT', `Gemini model ${model} returned empty response`);
          continue;
        }

        const parsed = JSON.parse(rawJsonText) as GeminiGrievanceResult;

        logger.log(
          'CHATBOT',
          `Gemini successfully synthesized draft: "${parsed.draft?.title || parsed.replyText}"`,
          {
            complete: parsed.complete,
            category: parsed.category,
          },
        );

        return parsed;
      } catch (err: unknown) {
        logger.warn('CHATBOT', `Gemini model ${model} execution error:`, err);
      } finally {
        clearTimeout(timer);
      }
    }

    logger.warn('CHATBOT', 'All Gemini models exhausted; falling back to local simulator');
    return null;
  },
};
