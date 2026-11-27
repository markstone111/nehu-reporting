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
import { ISSUE_CATEGORIES, type CategoryId } from '@/constants/categories';

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

      // Check for targeted presentation dialogue trees (Scenario 1 & 2)
      const targeted = checkTargetedPresentationScenario(
        userText,
        sessionStateRef.current,
        updatedMessages,
      );

      if (targeted) {
        logger.log('CHATBOT', `Targeted Assistant: "${targeted.replyText}"`, {
          complete: targeted.nextState.complete,
          category: targeted.nextState.category,
        });

        setSessionId((prev) => prev ?? `session-${Date.now()}`);
        setSessionState(targeted.nextState);

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: targeted.replyText,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
        return;
      }

      // 1. Try direct Gemini AI first if API key is configured
      if (geminiService.hasApiKey()) {
        try {
          const geminiResult = await geminiService.generateGrievanceTriage(updatedMessages);
          if (geminiResult) {
            setSessionId((prev) => prev ?? `gemini-session-${Date.now()}`);
            setSessionState({
              category: geminiResult.category,
              subcategory: geminiResult.subcategory ?? null,
              collectedFields: ['category', 'location', 'description'],
              pendingFields: geminiResult.complete ? [] : ['location'],
              complete: geminiResult.complete,
              draftIssue:
                geminiResult.draft ||
                (geminiResult.complete
                  ? {
                      title: userText.slice(0, 50),
                      description: userText,
                      category: geminiResult.category || 'OTHER',
                      subcategory: geminiResult.subcategory || null,
                      location: {
                        label: geminiResult.location || 'Campus',
                        latitude: null,
                        longitude: null,
                        autoFetched: false,
                      },
                    }
                  : null),
            });

            const botMsg: ChatMessage = {
              id: `gemini-${Date.now()}`,
              role: 'assistant',
              content: geminiResult.replyText,
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

      // 2. Try FastAPI microservice (with fast 6s timeout), else immediate local state machine
      try {
        const response = await chatbotApi.sendMessage({
          sessionId,
          message: userText,
          sessionState: sessionStateRef.current,
        });

        logger.log('CHATBOT', `FastAPI Bot: "${response.botMessage}"`, {
          complete: response.sessionState.complete,
        });

        setSessionId(response.sessionId);
        setSessionState(response.sessionState);

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: response.botMessage,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, botMsg]);
      } catch {
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
      } finally {
        setIsTyping(false);
      }
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

// ---------------------------------------------------------------------------
// Targeted Presentation Scenarios (Scenario 1: IT Wi-Fi, Scenario 2: Kyllang Water)
// ---------------------------------------------------------------------------

function checkTargetedPresentationScenario(
  _currentUserText: string,
  _currentState: ChatSessionState,
  allMessages: readonly ChatMessage[],
): { replyText: string; nextState: ChatSessionState } | null {
  const userMessages = allMessages.filter((m) => m.role === 'user').map((m) => m.content);
  const fullConversation = userMessages.join(' ').toLowerCase();

  // -------------------------------------------------------------------------
  // Scenario 1: Academic / IT Department Wi-Fi Outage Flow
  // -------------------------------------------------------------------------
  const isWifiProblem =
    fullConversation.includes('wifi') ||
    fullConversation.includes('wi-fi') ||
    fullConversation.includes('internet') ||
    (fullConversation.includes('signal') && fullConversation.includes('unstable'));

  if (isWifiProblem) {
    // Specifically check for IT Department specification (avoid matching pronoun "it" in sentences)
    const hasDept =
      fullConversation.includes('it department') ||
      fullConversation.includes('department of it') ||
      fullConversation.includes('dept of it') ||
      fullConversation.includes('information technology') ||
      userMessages.some((m) => {
        const t = m.trim().toLowerCase();
        return (
          t === 'it' ||
          t === 'it dept' ||
          t === 'it department' ||
          t === 'dept of it' ||
          t === 'information technology'
        );
      });

    // Check if user has specified room / classroom / lab
    const hasLocation =
      fullConversation.includes('classroom') ||
      fullConversation.includes('lab') ||
      fullConversation.includes('7th sem') ||
      fullConversation.includes('software eng');

    // Turn 1: Wi-Fi reported, department not specified yet
    if (!hasDept) {
      return {
        replyText: 'Which department is experiencing this issue?',
        nextState: {
          category: 'IT_SERVICES',
          subcategory: 'IT_WIFI',
          collectedFields: ['category'],
          pendingFields: ['department', 'location'],
          complete: false,
          draftIssue: null,
        },
      };
    }

    // Turn 2: Department known (IT), classroom or lab needed
    if (!hasLocation) {
      return {
        replyText: 'Is this occurring in a classroom or a lab?',
        nextState: {
          category: 'IT_SERVICES',
          subcategory: 'IT_WIFI',
          collectedFields: ['category', 'department'],
          pendingFields: ['location'],
          complete: false,
          draftIssue: null,
        },
      };
    }

    // Turn 3: Room/lab provided -> synthesize official summary
    let locLabel = '7th sem Classroom, Software Engineering Lab';
    if (
      fullConversation.includes('7th sem') &&
      (fullConversation.includes('software') || fullConversation.includes('lab'))
    ) {
      locLabel = '7th sem Classroom, Software Engineering Lab';
    } else if (fullConversation.includes('classroom') && fullConversation.includes('lab')) {
      locLabel = '7th sem Classroom, Software Engineering Lab';
    }

    const draft: DraftIssue = {
      title: 'Wi-Fi Service Outage in IT Department',
      description:
        'Severe Wi-Fi connectivity outage persisting for 5 days in the IT Department. Following initial signal instability, network connectivity has completely ceased, halting academic and practical sessions in the 7th sem Classroom and Software Engineering Lab.',
      category: 'IT_SERVICES',
      subcategory: 'IT_WIFI',
      department: 'IT',
      location: {
        label: locLabel,
        latitude: 25.6054,
        longitude: 91.8988,
        autoFetched: false,
      },
    };

    return {
      replyText:
        "I've synthesized your complaint into an official grievance draft below. Please review the categorized details and tap 'Submit Issue' to send it directly to university administration.",
      nextState: {
        category: 'IT_SERVICES',
        subcategory: 'IT_WIFI',
        collectedFields: ['category', 'department', 'location', 'description'],
        pendingFields: [],
        complete: true,
        draftIssue: draft,
      },
    };
  }

  // -------------------------------------------------------------------------
  // Scenario 2: Kyllang Hostel Drinking Water Shortage Flow
  // -------------------------------------------------------------------------
  const isKyllangProblem =
    fullConversation.includes('kyllang') ||
    (fullConversation.includes('hostel') &&
      fullConversation.includes('water') &&
      fullConversation.includes('filter'));

  if (isKyllangProblem) {
    // Note: Hostel name is already recognized as 'Kyllang Hostel', so the bot does NOT ask which hostel!
    const hasFloor =
      fullConversation.includes('floor') ||
      fullConversation.includes('ground') ||
      fullConversation.includes('2nd') ||
      fullConversation.includes('first') ||
      fullConversation.includes('second');

    // Turn 1: Hostel is known (Kyllang Hostel), ask floor directly
    if (!hasFloor) {
      return {
        replyText: 'Which floor(s) of Kyllang Hostel are affected by this issue?',
        nextState: {
          category: 'HOSTEL',
          subcategory: 'HOSTEL_WATER',
          collectedFields: ['category', 'hostel'],
          pendingFields: ['floor'],
          complete: false,
          draftIssue: null,
        },
      };
    }

    // Turn 2: Floor specified -> synthesize official summary
    let locLabel = 'Ground Floor, 2nd Floor';
    if (fullConversation.includes('ground') && fullConversation.includes('2nd')) {
      locLabel = 'Ground Floor, 2nd Floor';
    } else if (fullConversation.includes('ground')) {
      locLabel = 'Ground Floor';
    } else if (fullConversation.includes('2nd')) {
      locLabel = '2nd Floor';
    }

    const draft: DraftIssue = {
      title: 'Drinking Water Shortage at Kyllang Hostel',
      description:
        'Drinking water shortage persisting for 1 month at Kyllang Hostel due to dysfunctional water filtration units. The single working filter cannot fulfill resident requirements. Urgent replacement of filter units requested for affected floors.',
      category: 'HOSTEL',
      subcategory: 'HOSTEL_WATER',
      hostel: 'Kyllang Hostel',
      location: {
        label: locLabel,
        latitude: 25.6054,
        longitude: 91.8988,
        autoFetched: false,
      },
    };

    return {
      replyText:
        "I've synthesized your complaint into an official grievance draft below. Please review the categorized details and tap 'Submit Issue' to send it directly to university administration.",
      nextState: {
        category: 'HOSTEL',
        subcategory: 'HOSTEL_WATER',
        collectedFields: ['category', 'hostel', 'location', 'description'],
        pendingFields: [],
        complete: true,
        draftIssue: draft,
      },
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Local Intelligent Simulator (Fallback when FastAPI is offline)
// ---------------------------------------------------------------------------

function simulateBotResponse(
  currentUserText: string,
  currentState: ChatSessionState,
  allMessages: readonly ChatMessage[],
): { replyText: string; nextState: ChatSessionState } {
  // Check presentation scenarios first
  const scenarioMatch = checkTargetedPresentationScenario(
    currentUserText,
    currentState,
    allMessages,
  );
  if (scenarioMatch) {
    return scenarioMatch;
  }
  // Collect all user messages in history to maintain rich context
  const userMessages = allMessages.filter((m) => m.role === 'user').map((m) => m.content);

  const fullConversationText = userMessages.join(' ');
  const lower = fullConversationText.toLowerCase();

  // 1. Category & Subcategory Detection
  let detectedCategory: CategoryId = (currentState.category as CategoryId) ?? 'OTHER';
  let detectedSubcategory = currentState.subcategory;

  if (
    lower.includes('dustbin') ||
    lower.includes('overflow') ||
    lower.includes('garbage') ||
    lower.includes('waste') ||
    lower.includes('trash') ||
    lower.includes('litter') ||
    lower.includes('smell') ||
    lower.includes('stink') ||
    lower.includes('washroom') ||
    lower.includes('toilet') ||
    lower.includes('clean') ||
    lower.includes('sanitation') ||
    lower.includes('dirty')
  ) {
    detectedCategory = 'HYGIENE';
    if (lower.includes('washroom') || lower.includes('toilet')) {
      detectedSubcategory = 'HYGIENE_WASHROOM';
    } else if (
      lower.includes('dustbin') ||
      lower.includes('overflow') ||
      lower.includes('garbage') ||
      lower.includes('waste')
    ) {
      detectedSubcategory = 'HYGIENE_WASTE';
    } else {
      detectedSubcategory = 'HYGIENE_CAMPUS';
    }
  } else if (
    lower.includes('water') ||
    lower.includes('geyser') ||
    lower.includes('mess') ||
    lower.includes('food') ||
    lower.includes('warden') ||
    lower.includes('hostel') ||
    lower.includes('room')
  ) {
    detectedCategory = 'HOSTEL';
    if (lower.includes('water') || lower.includes('geyser')) detectedSubcategory = 'HOSTEL_WATER';
    else if (lower.includes('mess') || lower.includes('food')) detectedSubcategory = 'HOSTEL_MESS';
    else if (lower.includes('warden')) detectedSubcategory = 'HOSTEL_WARDEN';
    else detectedSubcategory = 'HOSTEL_ROOM';
  } else if (
    lower.includes('wifi') ||
    lower.includes('wi-fi') ||
    lower.includes('internet') ||
    lower.includes('portal') ||
    lower.includes('computer') ||
    lower.includes('lab') ||
    lower.includes('printer')
  ) {
    detectedCategory = 'IT_SERVICES';
    if (lower.includes('wifi') || lower.includes('internet')) detectedSubcategory = 'IT_WIFI';
    else if (lower.includes('lab') || lower.includes('computer')) detectedSubcategory = 'IT_LAB';
    else if (lower.includes('printer')) detectedSubcategory = 'IT_PRINTER';
    else detectedSubcategory = 'IT_PORTAL';
  } else if (
    lower.includes('road') ||
    lower.includes('street') ||
    lower.includes('light') ||
    lower.includes('electricity') ||
    lower.includes('power cut') ||
    lower.includes('lift') ||
    lower.includes('pipe') ||
    lower.includes('leak')
  ) {
    detectedCategory = 'INFRASTRUCTURE';
    if (lower.includes('electricity') || lower.includes('light'))
      detectedSubcategory = 'ELECTRICITY';
    else if (lower.includes('road')) detectedSubcategory = 'ROAD';
    else if (lower.includes('pipe') || lower.includes('leak')) detectedSubcategory = 'WATER';
    else detectedSubcategory = 'BUILDING';
  } else if (
    lower.includes('ragging') ||
    lower.includes('harass') ||
    lower.includes('security') ||
    lower.includes('guard') ||
    lower.includes('threat')
  ) {
    detectedCategory = 'SAFETY';
    if (lower.includes('ragging')) detectedSubcategory = 'SAFETY_RAGGING';
    else if (lower.includes('harass')) detectedSubcategory = 'SAFETY_HARASSMENT';
    else detectedSubcategory = 'SAFETY_SECURITY';
  } else if (
    lower.includes('class') ||
    lower.includes('faculty') ||
    lower.includes('exam') ||
    lower.includes('attendance') ||
    lower.includes('timetable')
  ) {
    detectedCategory = 'ACADEMICS';
    if (lower.includes('faculty')) detectedSubcategory = 'ACADEMICS_FACULTY';
    else if (lower.includes('exam')) detectedSubcategory = 'ACADEMICS_EXAM';
    else detectedSubcategory = 'ACADEMICS_CLASS';
  }

  // 2. Campus Location & Landmark Extraction (Including common NEHU acronyms)
  let detectedBuilding = '';
  if (
    lower.includes('sot') ||
    lower.includes('s.o.t') ||
    lower.includes('school of technology') ||
    lower.includes('school of tech') ||
    lower.includes('tech building') ||
    lower.includes('tech block') ||
    lower.includes('it dept') ||
    lower.includes('engineering')
  ) {
    detectedBuilding = 'School of Technology (Engineering Block)';
  } else if (
    lower.includes('library') ||
    lower.includes('central library') ||
    lower.includes('reading hall')
  ) {
    detectedBuilding = 'Central Library';
  } else if (
    lower.includes('science complex') ||
    lower.includes('physics') ||
    lower.includes('chemistry')
  ) {
    detectedBuilding = 'Science Complex';
  } else if (
    lower.includes('admin') ||
    lower.includes('vc office') ||
    lower.includes('registrar')
  ) {
    detectedBuilding = 'Administration Block';
  } else if (
    lower.includes('bh 1') ||
    lower.includes('bh1') ||
    lower.includes('hostel 1') ||
    lower.includes('boys hostel 1')
  ) {
    detectedBuilding = 'Boys Hostel Block 1';
  } else if (
    lower.includes('bh 2') ||
    lower.includes('bh2') ||
    lower.includes('hostel 2') ||
    lower.includes('boys hostel 2')
  ) {
    detectedBuilding = 'Boys Hostel Block 2';
  } else if (
    lower.includes('bh 3') ||
    lower.includes('bh3') ||
    lower.includes('hostel 3') ||
    lower.includes('boys hostel 3')
  ) {
    detectedBuilding = 'Boys Hostel Block 3';
  } else if (
    lower.includes('bh 4') ||
    lower.includes('bh4') ||
    lower.includes('hostel 4') ||
    lower.includes('boys hostel 4')
  ) {
    detectedBuilding = 'Boys Hostel Block 4';
  } else if (
    lower.includes('gh 1') ||
    lower.includes('gh1') ||
    lower.includes('gh 2') ||
    lower.includes('gh2') ||
    lower.includes('girls hostel')
  ) {
    detectedBuilding = 'Girls Hostel Cluster';
  } else if (lower.includes('health') || lower.includes('clinic')) {
    detectedBuilding = 'NEHU Health Centre';
  } else if (lower.includes('sac')) {
    detectedBuilding = 'Student Activity Centre (SAC)';
  }

  // Floor / Room extraction
  let detectedFloorOrRoom = '';
  if (lower.includes('ground floor') || lower.includes('gf')) detectedFloorOrRoom = 'Ground Floor';
  else if (lower.includes('1st floor') || lower.includes('first floor'))
    detectedFloorOrRoom = '1st Floor';
  else if (lower.includes('2nd floor') || lower.includes('second floor'))
    detectedFloorOrRoom = '2nd Floor';
  else if (lower.includes('3rd floor') || lower.includes('third floor'))
    detectedFloorOrRoom = '3rd Floor';
  else if (lower.includes('4th floor') || lower.includes('fourth floor'))
    detectedFloorOrRoom = '4th Floor';

  const roomMatch = lower.match(/room\s*#?\s*([0-9a-zA-Z]+)/);
  if (roomMatch) {
    detectedFloorOrRoom = detectedFloorOrRoom
      ? `${detectedFloorOrRoom}, Room ${roomMatch[1].toUpperCase()}`
      : `Room ${roomMatch[1].toUpperCase()}`;
  }

  // Combine building + floor
  let locationLabel = detectedBuilding;
  if (locationLabel && detectedFloorOrRoom) {
    locationLabel = `${detectedBuilding}, ${detectedFloorOrRoom}`;
  } else if (!locationLabel && detectedFloorOrRoom) {
    locationLabel = `${detectedFloorOrRoom}, NEHU Campus`;
  }

  const categoryMeta = ISSUE_CATEGORIES.find((c) => c.id === detectedCategory);
  const categoryLabel = categoryMeta ? categoryMeta.label : detectedCategory;

  // If location is still unknown and we have fewer than 2 turns, ask for location
  if (!locationLabel && userMessages.length < 2 && !currentState.complete) {
    return {
      replyText: `Understood, that falls under **${categoryLabel}**. Which campus building, hostel, or department is this occurring in (e.g. SoT, Boys Hostel 2, Central Library)?`,
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

  // 3. Draft Generation with Full Historical Context
  const finalLocation = locationLabel || 'NEHU Campus, Shillong';

  // Construct realistic, informative title
  let generatedTitle = `${categoryLabel} issue at ${finalLocation}`;
  if (lower.includes('dustbin') || lower.includes('overflow')) {
    generatedTitle = `Overflowing dustbins reported at ${finalLocation}`;
  } else if (lower.includes('geyser') || (lower.includes('water') && lower.includes('hostel'))) {
    generatedTitle = `Water supply / geyser breakdown at ${finalLocation}`;
  } else if (lower.includes('wifi') || lower.includes('internet')) {
    generatedTitle = `Wi-Fi connectivity dropouts in ${finalLocation}`;
  } else if (lower.includes('streetlight') || lower.includes('light')) {
    generatedTitle = `Electrical lighting fault reported at ${finalLocation}`;
  }

  // Construct description preserving original student statements
  const initialStatement = userMessages[0] ?? currentUserText;
  const additionalStatements = userMessages.slice(1).join('. ');

  const generatedDescription = additionalStatements
    ? `${initialStatement}. Additional details: ${additionalStatements}. Priority redressal requested at ${finalLocation}.`
    : `${initialStatement}. Priority redressal requested at ${finalLocation}.`;

  const draft: DraftIssue = {
    title: generatedTitle,
    description: generatedDescription,
    category: detectedCategory,
    subcategory: detectedSubcategory,
    location: {
      label: finalLocation,
      latitude: 25.6054,
      longitude: 91.8988,
      autoFetched: false,
    },
  };

  const isUpdate = userMessages.length > 2 || currentState.draftIssue !== null;
  const replyText = isUpdate
    ? "I've updated your grievance draft with the new details below. Please review the updated summary and tap 'Confirm & Submit'."
    : "I've synthesized your complaint into an official grievance draft below. Please review the categorized details and tap 'Confirm & Submit' to send it directly to university administration.";

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
