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
import type { CategoryId } from '@/constants/categories';

export interface GeminiGrievanceResult {
  replyText: string;
  category: CategoryId;
  subcategory?: string;
  location?: string;
  complete: boolean;
  draft: DraftIssue | null;
}

const CANDIDATE_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
] as const;

const GEMINI_REQUEST_TIMEOUT_MS = 8000;
const MAX_CONTEXT_MESSAGES = 8;

const SYSTEM_PROMPT = `You are the AI Grievance Redressal Assistant for NEHU Shillong. Extract the issue, category, and campus location from informal English/Hindi-English text, and draft a formal report.

Categories & Subcategories:
- HOSTEL: HOSTEL_ROOM, HOSTEL_MESS, HOSTEL_WASHROOM, HOSTEL_WATER, HOSTEL_ELECTRICITY, HOSTEL_WARDEN
- ACADEMIC: ACAD_FACULTY, ACAD_EXAM, ACAD_CLASSROOM, ACAD_TIMETABLE, ACAD_LIBRARY
- INFRASTRUCTURE: INFRA_ROAD, INFRA_LIGHTING, INFRA_BUILDING, INFRA_WATER, INFRA_POWER
- IT_SERVICES: IT_WIFI, IT_PORTAL, IT_LAB, IT_HARDWARE
- SANITATION: SANIT_TOILETS, SANIT_GARBAGE, SANIT_PESTS
- SECURITY: SEC_GATE, SEC_RAGGING, SEC_HARASSMENT, SEC_LIGHTING
- TRANSPORT: TRANS_BUS, TRANS_PARKING
- HYGIENE: HYGIENE_WASHROOM, HYGIENE_WASTE, HYGIENE_CAMPUS
- OTHER: OTHER_ADMIN, OTHER_CANTEEN, OTHER_GENERAL

Campuses/Landmarks: School of Technology (SoT / Engineering Block), Central Library, Admin Block, Science Complex, Boys Hostels (BH1-BH4, Kyllang), Girls Hostels (GH1-GH3), SAC, Health Centre, Guest House, Gate 1 & 2, Central Mess.

Rules:
1. Be empathetic and concise.
2. "dustbins/garbage/trash/waste/stink" -> HYGIENE (HYGIENE_WASTE). "SoT/sot" -> "School of Technology (Engineering Block)".
3. If location is missing, ask a short clarifying question (complete=false, draft=null).
4. For departmental Wi-Fi/lab without department name, ask "Which department is experiencing this issue?", then "Is this occurring in a classroom or a lab?".
5. If hostel name is given (e.g. Kyllang, BH1, GH2), ask only for floor/room.
6. Once location and issue are clear: title (max 70 chars), formal description, complete=true, warm 1-sentence replyText.

Respond strictly with valid JSON:
{"replyText":"string","category":"HYGIENE","subcategory":"HYGIENE_WASTE","location":"string","complete":true,"draft":{"title":"string","description":"string","category":"HYGIENE","subcategory":"HYGIENE_WASTE","location":{"label":"string","latitude":25.6054,"longitude":91.8988,"autoFetched":false}}}`;

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
              temperature: 0.2,
              maxOutputTokens: 320,
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
