/**
 * useChatbot Hook — src/hooks/useChatbot.ts
 *
 * Manages conversational state, message history, typing indicators,
 * and AI draft generation for the grievance reporting chatbot.
 *
 * Calls Soumojit's FastAPI /chatbot/message endpoint, with an intelligent
 * local fallback state machine for offline phone testing.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { chatbotApi } from '@/api/chatbot.api';
import { geminiService } from '@/services/gemini.service';
import { NotificationService } from '@/services/notification.service';
import { logger } from '@/utils/logger.utils';
import type { ChatMessage, ChatSessionState, DraftIssue } from '@/types/api.types';
import { ISSUE_CATEGORIES, CATEGORY_IDS, type CategoryId } from '@/constants/categories';
import {
  ALL_NEHU_LOCATIONS,
  NEHU_LOCATIONS_BY_CATEGORY,
  findCanonicalLocation,
  searchMatchingLocations,
} from '@/services/location.service';

const INITIAL_GREETING: ChatMessage = {
  id: 'msg-welcome',
  role: 'assistant',
  content:
    "Hello! I'm your NEHU Grievance Assistant. You can describe any issue on campus in everyday words (English, campus abbreviations like SoT or BH2, or informal chat) — I'll identify the department, extract the location, and prepare a formal report for university review. What's going on?",
  timestamp: new Date().toISOString(),
};

const INITIAL_SESSION_STATE: ChatSessionState = {
  category: null,
  subcategory: null,
  collectedFields: [],
  pendingFields: ['category', 'location', 'description'],
  complete: false,
  draftIssue: null,
};

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<ChatSessionState>(INITIAL_SESSION_STATE);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a reference to current session state and messages for closures
  const sessionStateRef = useRef(sessionState);
  sessionStateRef.current = sessionState;
  const lastNotifiedDraftRef = useRef<string | null>(null);

  useEffect(() => {
    if (sessionState.complete && sessionState.draftIssue) {
      const draftKey = `${sessionId ?? 'local'}:${sessionState.draftIssue.title}`;
      if (lastNotifiedDraftRef.current !== draftKey) {
        lastNotifiedDraftRef.current = draftKey;
        NotificationService.notifyAiDraftReady(sessionState.draftIssue.title);
      }
    }
  }, [sessionState.complete, sessionState.draftIssue, sessionId]);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  /**
   * Send user message to the chatbot
   */
  const sendMessage = useCallback(
    async (text: string) => {
      const userText = text.trim();
      if (!userText) return;

      logger.log('CHATBOT', `User: "${userText}"`);

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userText,
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...messagesRef.current, userMsg];
      setMessages(updatedMessages);
      setIsTyping(true);
      setError(null);

      // 1. Try direct Gemini AI first if API key is configured
      if (geminiService.hasApiKey()) {
        try {
          const geminiResult = await geminiService.generateGrievanceTriage(updatedMessages);
          if (geminiResult) {
            setSessionId((prev) => prev ?? `gemini-session-${Date.now()}`);
            const rawGeminiLoc =
              geminiResult.draft?.location?.label?.trim() || geminiResult.location?.trim() || '';
            const strictLocation = rawGeminiLoc
              ? findCanonicalLocation(rawGeminiLoc, geminiResult.category) ??
                findCanonicalLocation(rawGeminiLoc, null) ??
                (findExplicitLocationInText(rawGeminiLoc, geminiResult.category as CategoryId) ||
                  null)
              : null;
            const isActuallyComplete = Boolean(geminiResult.complete && strictLocation);

            let finalReply = geminiResult.replyText;
            if (geminiResult.complete && !strictLocation) {
              const suggestions = searchMatchingLocations(
                rawGeminiLoc || userText,
                geminiResult.category,
                4,
              ).join(', ');
              finalReply = suggestions
                ? `Please pick an official NEHU Shillong location from the list (e.g. ${suggestions}).`
                : 'Please specify an official NEHU Shillong building, hostel, or department from the campus list.';
            }

            setSessionState({
              category: geminiResult.category,
              subcategory: geminiResult.subcategory ?? null,
              collectedFields: isActuallyComplete
                ? ['category', 'location', 'description']
                : ['category'],
              pendingFields: isActuallyComplete ? [] : ['location'],
              complete: isActuallyComplete,
              draftIssue: isActuallyComplete
                ? {
                    title: geminiResult.draft?.title || userText.slice(0, 50),
                    description: geminiResult.draft?.description || userText,
                    category: geminiResult.category || CATEGORY_IDS.CAMPUS_FACILITIES,
                    subcategory: geminiResult.subcategory || null,
                    location: {
                      label: strictLocation!,
                      latitude: geminiResult.draft?.location?.latitude ?? 25.6054,
                      longitude: geminiResult.draft?.location?.longitude ?? 91.8988,
                      autoFetched: false,
                    },
                  }
                : null,
            });

            const botMsg: ChatMessage = {
              id: `gemini-${Date.now()}`,
              role: 'assistant',
              content: finalReply,
              timestamp: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, botMsg]);
            setIsTyping(false);
            return;
          }
        } catch (geminiErr) {
          logger.warn('CHATBOT', 'Gemini generation error, trying FastAPI/local fallback', geminiErr);
        }
      }

      // 2. Fall back immediately to instant local state machine (no dead 6s FastAPI roundtrip)
      const simulated = simulateBotResponse(userText, sessionStateRef.current, updatedMessages);

      logger.log('CHATBOT', `Simulator Bot: "${simulated.replyText}"`, {
        complete: simulated.nextState.complete,
        category: simulated.nextState.category,
      });

      setSessionId((prev) => prev ?? `demo-session-${Date.now()}`);
      setSessionState(simulated.nextState);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: simulated.replyText,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    },
    [sessionId],
  );

  /**
   * User wants to add more details or edit the draft
   */
  const requestMoreDetails = useCallback(() => {
    logger.log('CHATBOT', 'User clicked "Add More Details" — unlocking input bar');

    setSessionState((prev) => ({
      ...prev,
      complete: false,
    }));

    const promptMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      role: 'assistant',
      content:
        'Sure! What additional details or corrections would you like to add? Just type them below.',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, promptMsg]);
  }, []);

  /**
   * Reset session and restart conversation
   */
  const resetSession = useCallback(() => {
    logger.log('CHATBOT', 'Conversation reset');
    if (sessionId) {
      chatbotApi.abandonSession(sessionId);
    }
    setSessionId(null);
    setSessionState(INITIAL_SESSION_STATE);
    setMessages([
      {
        ...INITIAL_GREETING,
        id: `msg-welcome-${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
    ]);
    setIsTyping(false);
    setError(null);
  }, [sessionId]);

  return {
    messages,
    sessionState,
    isTyping,
    error,
    sendMessage,
    requestMoreDetails,
    resetSession,
    sessionId,
  };
}

function detectCategoryAndSubcategory(
  lower: string,
  currentState: ChatSessionState,
): { category: CategoryId; subcategory: string | null } {
  // Hostel & Residential
  if (
    lower.includes('hostel') ||
    lower.includes('warden') ||
    lower.includes('mess') ||
    lower.includes('geyser') ||
    lower.includes('room') ||
    lower.includes('kyllang') ||
    lower.includes('umiam') ||
    lower.includes('bh ') ||
    lower.includes('gh ') ||
    lower.includes('curfew')
  ) {
    let sub = '9fdcd1a9-efad-49c9-9552-6f8511548d45'; // Room Allotment & Cleanliness
    if (lower.includes('mess') || lower.includes('food') || lower.includes('meal')) {
      sub = '5b267187-0ec3-4dea-9e07-98ad2430e81a'; // Mess Food & Hygiene
    } else if (
      lower.includes('water') ||
      lower.includes('geyser') ||
      lower.includes('plumbing') ||
      lower.includes('leak') ||
      lower.includes('electric') ||
      lower.includes('wifi') ||
      lower.includes('wi-fi') ||
      lower.includes('router') ||
      lower.includes('fan') ||
      lower.includes('light')
    ) {
      sub = '0bc346d3-716a-4fac-80a7-ce7d29836fbd'; // Maintenance & Hostel Wi-Fi
    } else if (
      lower.includes('curfew') ||
      lower.includes('theft') ||
      lower.includes('security') ||
      lower.includes('unauthorized') ||
      lower.includes('ragging')
    ) {
      sub = 'ebddeedf-57b5-45cd-8de5-5c31a849cb3d'; // Safety & Security
    }
    return { category: CATEGORY_IDS.HOSTEL, subcategory: sub };
  }

  // Library & Research Facilities
  if (
    lower.includes('library') ||
    lower.includes('reading room') ||
    lower.includes('book') ||
    lower.includes('librarian') ||
    lower.includes('journal')
  ) {
    let sub = 'c5369512-4b53-401f-8ca3-7033bca549cf'; // Reading Room Environment
    if (
      lower.includes('wifi') ||
      lower.includes('wi-fi') ||
      lower.includes('internet') ||
      lower.includes('portal') ||
      lower.includes('digital')
    ) {
      sub = '53fa3e88-086f-46ed-a87b-5828e3c2691c'; // Library Wi-Fi & Digital Resources
    } else if (
      lower.includes('book') ||
      lower.includes('textbook') ||
      lower.includes('borrow') ||
      lower.includes('late fee')
    ) {
      sub = 'd69f7cfb-9a56-4336-91c7-44770b2c6154'; // Book Availability & Circulation
    }
    return { category: CATEGORY_IDS.LIBRARY, subcategory: sub };
  }

  // Sports & Gymnasium
  if (
    lower.includes('sport') ||
    lower.includes('gym') ||
    lower.includes('court') ||
    lower.includes('ground') ||
    lower.includes('stadium') ||
    lower.includes('treadmill') ||
    lower.includes('sac')
  ) {
    let sub = 'cdb4321c-18f9-4f61-be86-f4294d8998ce'; // Ground/Court Booking
    if (
      lower.includes('treadmill') ||
      lower.includes('net') ||
      lower.includes('weight') ||
      lower.includes('equipment') ||
      lower.includes('broken')
    ) {
      sub = '2ca4b831-69d0-43fa-8a7f-b7c051caa36c'; // Equipment Condition
    } else if (
      lower.includes('timing') ||
      lower.includes('hour') ||
      lower.includes('closed') ||
      lower.includes('open')
    ) {
      sub = 'c20c72ff-c3cb-4ee5-8a41-9eaf1de2dd4b'; // Timings & Accessibility
    }
    return { category: CATEGORY_IDS.SPORTS, subcategory: sub };
  }

  // Academic & Department
  if (
    lower.includes('lab') ||
    lower.includes('class') ||
    lower.includes('faculty') ||
    lower.includes('professor') ||
    lower.includes('hod') ||
    lower.includes('exam') ||
    lower.includes('result') ||
    lower.includes('attendance') ||
    lower.includes('timetable') ||
    lower.includes('department') ||
    lower.includes('dept') ||
    lower.includes('sot')
  ) {
    let sub = '255eefd1-3f22-49af-992b-a15d061a3242'; // Department Labs & Academic Wi-Fi
    if (lower.includes('timetable') || lower.includes('attendance') || lower.includes('clash')) {
      sub = 'f50e2f36-590f-44b7-8873-b97768dd80c2'; // Timetable & Attendance
    } else if (lower.includes('exam') || lower.includes('result') || lower.includes('admit')) {
      sub = '578f6b1c-1a40-4ac0-bdb2-c016188ba8d8'; // Exams, Results & Evaluation
    } else if (
      lower.includes('faculty') ||
      lower.includes('professor') ||
      lower.includes('teacher') ||
      lower.includes('conduct')
    ) {
      sub = 'a80492c3-880b-4a4f-83ac-6519f6d78699'; // Faculty & Staff Conduct
    }
    return { category: CATEGORY_IDS.ACADEMIC, subcategory: sub };
  }

  // Campus & Facilities (Central Level)
  if (
    lower.includes('dustbin') ||
    lower.includes('garbage') ||
    lower.includes('waste') ||
    lower.includes('washroom') ||
    lower.includes('toilet') ||
    lower.includes('sanitation') ||
    lower.includes('dirty') ||
    lower.includes('drinking water') ||
    lower.includes('canteen') ||
    lower.includes('cafeteria') ||
    lower.includes('bus') ||
    lower.includes('transport') ||
    lower.includes('parking') ||
    lower.includes('wifi') ||
    lower.includes('wi-fi') ||
    lower.includes('internet') ||
    lower.includes('server') ||
    lower.includes('portal')
  ) {
    let sub = 'f6b32c0e-7fce-4414-81c0-62207dc21beb'; // Hygiene & Sanitation
    if (lower.includes('canteen') || lower.includes('cafeteria') || lower.includes('stall')) {
      sub = '1fa23ab6-e6cf-4cc8-8062-ed83ad3bab7c'; // Canteen & Cafeteria
    } else if (lower.includes('bus') || lower.includes('transport') || lower.includes('parking')) {
      sub = 'c4486d91-dacc-43e7-8ba5-1275d6078808'; // Transport & Parking
    } else if (
      lower.includes('wifi') ||
      lower.includes('wi-fi') ||
      lower.includes('internet') ||
      lower.includes('server') ||
      lower.includes('portal')
    ) {
      sub = '4645ebbb-dbfb-44ce-9c47-44930f63cbee'; // Central IT & Escalations
    }
    return { category: CATEGORY_IDS.CAMPUS_FACILITIES, subcategory: sub };
  }

  return {
    category: (currentState.category as CategoryId) ?? CATEGORY_IDS.CAMPUS_FACILITIES,
    subcategory: currentState.subcategory ?? 'f6b32c0e-7fce-4414-81c0-62207dc21beb',
  };
}

function findExplicitLocationInText(text: string, categoryId: CategoryId): string {
  const lower = text.toLowerCase();

  // Check category-scoped canonical locations first, then all NEHU Shillong locations
  const pools = [
    ...(NEHU_LOCATIONS_BY_CATEGORY[categoryId] ?? []),
    ...ALL_NEHU_LOCATIONS,
  ];

  for (const loc of pools) {
    const locLower = loc.toLowerCase();
    if (lower.includes(locLower)) {
      return loc;
    }
    // Also match the core name before " (" or " —" (e.g. "Kyllang Hostel", "Football Ground")
    const core = locLower.split(/\s*[—(]/)[0]?.trim() ?? '';
    if (core.length >= 5 && lower.includes(core)) {
      return loc;
    }
    // Match parenthesized hostel/block names like "(Syntuksiar)" or "(Umshing)"
    const parenMatch = locLower.match(/\(([^)]+)\)/);
    if (parenMatch) {
      const alias = parenMatch[1].trim();
      if (alias.length >= 5 && !alias.includes(',') && lower.includes(alias)) {
        return loc;
      }
    }
  }

  // Common NEHU Shillong acronyms & shorthand — ONLY return exact strings from ALL_NEHU_LOCATIONS
  if (/\bit dept\b/i.test(lower) || /\bit department\b/i.test(lower) || lower.includes('department of it')) {
    return 'Department of Information Technology (School of Technology)';
  }
  if (/\bece\b/i.test(lower)) {
    return 'Department of Electronics and Communication Engineering (School of Technology)';
  }
  if (/\bbme\b/i.test(lower)) {
    return 'Department of Biomedical Engineering (School of Technology)';
  }
  if (/\bmca\b/i.test(lower) || lower.includes('computer applications')) {
    return 'Department of Computer Applications (School of Technology)';
  }
  if (/\bsac\b/i.test(lower)) {
    return 'Students Amenity Centre (SAC)';
  }
  if (/\bcentral library\b/i.test(lower) || /\bcyber room\b/i.test(lower)) {
    return 'Central Library — Main Reading Rooms';
  }
  if (/\badmin block\b/i.test(lower) || /\badministrative building\b/i.test(lower)) {
    return 'Administrative Building (Admin Block, Umshing)';
  }
  if (/\bdsw\b/i.test(lower)) {
    return "Dean of Students' Welfare (DSW) Office";
  }
  if (/\bsaif\b/i.test(lower)) {
    return 'Sophisticated Analytical Instrument Facility (SAIF-NEHU)';
  }
  if (/\bgym\b/i.test(lower) || /\bgymnasium\b/i.test(lower)) {
    return 'University Gymnasium (Fitness Center)';
  }
  if (/\bkyllang\b/i.test(lower)) return 'Kyllang Halls of Residence (UG Men)';
  if (/\bumiam\b/i.test(lower)) return 'Umiam Hall of Residence (Men)';
  if (/\bumngot\b/i.test(lower)) return 'Umngot Hall of Residence (Men)';
  if (/\bkupli\b/i.test(lower)) return 'Hostel No. 18: Kupli Halls of Residence (Men)';
  if (/\bsymper\b/i.test(lower)) return 'Hostel No. 23: Symper Halls of Residence (UG Men)';
  if (/\blasubon\b/i.test(lower)) return 'Hostel No. 1: Lasubon Halls of Residence (PG Women)';
  if (/\bgolden jubilee\b/i.test(lower)) {
    return 'Hostel No. 24: Golden Jubilee Girls Halls of Residence (UG/PG Women)';
  }

  return '';
}

function extractLocationLabel(
  currentUserText: string,
  fullConversationText: string,
  categoryId: CategoryId,
): string {
  // Strictly return ONLY an exact canonical string from ALL_NEHU_LOCATIONS (no floor/room appended)
  return (
    findExplicitLocationInText(currentUserText, categoryId) ||
    findExplicitLocationInText(fullConversationText, categoryId)
  );
}

function simulateBotResponse(
  currentUserText: string,
  currentState: ChatSessionState,
  allMessages: readonly ChatMessage[],
): { replyText: string; nextState: ChatSessionState } {
  const userMessages = allMessages.filter((m) => m.role === 'user').map((m) => m.content);
  const fullConversationText = userMessages.join(' ');
  const lower = fullConversationText.toLowerCase();

  const { category: detectedCategory, subcategory: detectedSubcategory } =
    detectCategoryAndSubcategory(lower, currentState);

  const locationLabel = extractLocationLabel(
    currentUserText,
    fullConversationText,
    detectedCategory,
  );

  const categoryMeta = ISSUE_CATEGORIES.find((c) => c.id === detectedCategory);
  const categoryLabel = categoryMeta ? categoryMeta.label : 'Campus and Facilities';

  // Do NOT invent a location — if missing, ask the user for the exact campus location
  if (!locationLabel) {
    const alreadyAskedLocation = allMessages.some(
      (m) =>
        m.role === 'assistant' &&
        m.id !== 'msg-welcome' &&
        (m.content.toLowerCase().includes('which specific') ||
          m.content.toLowerCase().includes('location')),
    );

    const sampleLocations = (NEHU_LOCATIONS_BY_CATEGORY[detectedCategory] ?? [])
      .slice(0, 3)
      .join(', ');
    const examplesHint = sampleLocations ? ` (e.g. ${sampleLocations})` : '';

    const replyText = alreadyAskedLocation
      ? `I couldn't match that to a NEHU Shillong building or hostel yet. Please name the exact campus location${examplesHint}.`
      : `Got it — this falls under **${categoryLabel}**. Which specific NEHU Shillong location is affected${examplesHint}?`;

    return {
      replyText,
      nextState: {
        category: detectedCategory,
        subcategory: detectedSubcategory,
        collectedFields: ['category'],
        pendingFields: ['location', 'description'],
        complete: false,
        draftIssue: null,
      },
    };
  }

  // If the user only typed a location without describing any problem, ask for the issue details
  const hasIssueDescription =
    userMessages.length > 1 ||
    currentUserText.trim().length > locationLabel.length + 6 ||
    /(not working|broken|issue|problem|dirty|leak|no water|slow|down|missing|fault|smell|overflow|damage|delay|clash|absent|harass|theft)/i.test(
      fullConversationText,
    );

  if (!hasIssueDescription) {
    return {
      replyText: `Got it, location noted as **${locationLabel}**. Could you briefly describe what the issue is?`,
      nextState: {
        category: detectedCategory,
        subcategory: detectedSubcategory,
        collectedFields: ['category', 'location'],
        pendingFields: ['description'],
        complete: false,
        draftIssue: null,
      },
    };
  }

  let generatedTitle = `${categoryLabel} issue at ${locationLabel}`;
  if (lower.includes('dustbin') || lower.includes('overflow')) {
    generatedTitle = `Overflowing dustbins at ${locationLabel}`;
  } else if (lower.includes('geyser') || (lower.includes('water') && lower.includes('hostel'))) {
    generatedTitle = `Water supply / geyser issue at ${locationLabel}`;
  } else if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('internet')) {
    generatedTitle = `Wi-Fi connectivity issue at ${locationLabel}`;
  } else if (lower.includes('light') || lower.includes('electric')) {
    generatedTitle = `Electrical lighting fault at ${locationLabel}`;
  }

  const initialStatement = userMessages[0] ?? currentUserText;
  const additionalStatements = userMessages.slice(1).join('. ');
  const generatedDescription = additionalStatements
    ? `${initialStatement}. ${additionalStatements}.`
    : initialStatement;

  const draft: DraftIssue = {
    title: generatedTitle,
    description: generatedDescription,
    category: detectedCategory,
    subcategory: detectedSubcategory,
    location: {
      label: locationLabel,
      latitude: 25.6054,
      longitude: 91.8988,
      autoFetched: false,
    },
  };

  const isUpdate = userMessages.length > 2 || currentState.draftIssue !== null;
  const replyText = isUpdate
    ? "I've updated your grievance draft below with the new details. Tap 'Submit Issue' when you're ready to send it."
    : "I've prepared your grievance draft below. Please review the details and tap 'Submit Issue' to send it to the concerned authority.";

  return {
    replyText,
    nextState: {
      category: detectedCategory,
      subcategory: detectedSubcategory,
      collectedFields: ['category', 'location', 'description'],
      pendingFields: [],
      complete: true,
      draftIssue: draft,
    },
  };
}
