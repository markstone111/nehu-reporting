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
  'gemini-flash-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
] as const;

const SYSTEM_PROMPT = `You are the official AI Grievance Redressal Assistant for North-Eastern Hill University (NEHU), Shillong.
Your mission is to converse with students, faculty, and campus residents in everyday, informal English, WhatsApp-style text, or Hindi/English mix.
You must extract the problem, categorize it, detect the specific NEHU campus location, and produce a formal, university-ready grievance draft.

NEHU Categories and Subcategories:
1. HOSTEL (subcategories: HOSTEL_ROOM, HOSTEL_MESS, HOSTEL_WASHROOM, HOSTEL_WATER, HOSTEL_ELECTRICITY, HOSTEL_WARDEN)
2. ACADEMIC (subcategories: ACAD_FACULTY, ACAD_EXAM, ACAD_CLASSROOM, ACAD_TIMETABLE, ACAD_LIBRARY)
3. INFRASTRUCTURE (subcategories: INFRA_ROAD, INFRA_LIGHTING, INFRA_BUILDING, INFRA_WATER, INFRA_POWER)
4. IT_SERVICES (subcategories: IT_WIFI, IT_PORTAL, IT_LAB, IT_HARDWARE)
5. SANITATION (subcategories: SANIT_TOILETS, SANIT_GARBAGE, SANIT_PESTS)
6. SECURITY (subcategories: SEC_GATE, SEC_RAGGING, SEC_HARASSMENT, SEC_LIGHTING)
7. TRANSPORT (subcategories: TRANS_BUS, TRANS_PARKING)
8. HYGIENE (subcategories: HYGIENE_WASHROOM, HYGIENE_WASTE, HYGIENE_CAMPUS)
9. OTHER (subcategories: OTHER_ADMIN, OTHER_CANTEEN, OTHER_GENERAL)

Recognized Campus Locations at NEHU Shillong:
- School of Technology (SoT / Engineering Block)
- Central Library
- Administrative Building (Admin Block)
- Science Complex (Physics, Chemistry, Life Sciences)
- Boys Hostels: BH1, BH2, BH3, BH4
- Girls Hostels: GH1, GH2, GH3
- Students Amenity Centre (SAC)
- Health Centre / University Dispensary
- Community Hall & Guest House
- Campus Gate 1 & Gate 2
- Central Mess

Rules:
1. Always be empathetic, helpful, and concise.
2. If the user mentions "dustbins", "garbage", "trash", "overflow", "waste", "stink", categorize under HYGIENE (HYGIENE_WASTE).
3. If the user mentions "SoT", "sot", or "engineering block", resolve to "School of Technology (Engineering Block)".
4. If location is missing or ambiguous, ask a polite clarifying question and set complete=false, draft=null.
5. Once location and problem description are known, synthesize a high-quality draft:
   - title: Concise and official (max 70 chars).
   - description: Formal, professional grievance report preserving all factual details reported by the student.
   - complete: true.
   - replyText: A warm sentence presenting the draft below for the student's confirmation.
6. If reporting a departmental Wi-Fi or lab issue and the specific department is not named, ask "Which department is experiencing this issue?". Once department is identified, ask "Is this occurring in a classroom or a lab?".
7. If the user already mentions their hostel (e.g. Kyllang Hostel, BH1, GH2), NEVER ask which hostel. Immediately identify the missing detail (e.g. which floor or room).

You MUST respond strictly with a valid JSON object matching this schema:
{
  "replyText": "string",
  "category": "HYGIENE",
  "subcategory": "HYGIENE_WASTE",
  "location": "School of Technology (Engineering Block), 2nd Floor",
  "complete": true,
  "draft": {
    "title": "string",
    "description": "string",
    "category": "HYGIENE",
    "subcategory": "HYGIENE_WASTE",
    "location": {
      "label": "string",
      "latitude": 25.6054,
      "longitude": 91.8988,
      "autoFetched": false
    }
  }
}`;

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

    // Format conversation history for Gemini
    const contents = allMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Try primary model, fallback to candidate models if busy
    for (const model of CANDIDATE_MODELS) {
      try {
        logger.log('CHATBOT', `Calling Gemini AI (${model}) for grievance triage...`);

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: SYSTEM_PROMPT }],
            },
            contents,
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.2,
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
      }
    }

    logger.warn('CHATBOT', 'All Gemini models exhausted; falling back to local simulator');
    return null;
  },
};
