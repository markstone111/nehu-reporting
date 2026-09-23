/**
 * useChatbot Hook — src/hooks/useChatbot.ts
 *
 * Manages conversational state, message history, typing indicators,
 * and AI draft generation for the grievance reporting chatbot.
 *
 * Calls Soumojit's FastAPI /chatbot/message endpoint, with an intelligent
 * local fallback state machine for offline phone testing.
 */

import { useState, useCallback, useRef } from 'react';
import { chatbotApi } from '@/api/chatbot.api';
import type { ChatMessage, ChatSessionState, DraftIssue } from '@/types/api.types';
import { ISSUE_CATEGORIES, type CategoryId } from '@/constants/categories';

const INITIAL_GREETING: ChatMessage = {
  id: 'msg-welcome',
  role: 'assistant',
  content:
    "Hello! I'm your NEHU Grievance Assistant. You can describe any issue on campus in everyday words (English or informal chat) — I'll identify the department, extract the location, and prepare a formal report for university review. What's going on?",
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

  // Keep a reference to current session state for closures
  const sessionStateRef = useRef(sessionState);
  sessionStateRef.current = sessionState;

  /**
   * Send user message to the chatbot
   */
  const sendMessage = useCallback(
    async (text: string) => {
      const userText = text.trim();
      if (!userText) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userText,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);
      setError(null);

      try {
        // Try the live FastAPI microservice
        const response = await chatbotApi.sendMessage({
          sessionId,
          message: userText,
          sessionState: sessionStateRef.current,
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
      } catch (err: unknown) {
        // Fallback: Intelligent local state machine for offline phone testing
        await new Promise((res) => setTimeout(res, 900)); // realistic typing delay

        const simulated = simulateBotResponse(userText, sessionStateRef.current);

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
   * Reset session and restart conversation
   */
  const resetSession = useCallback(() => {
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
    resetSession,
    sessionId,
  };
}

// ---------------------------------------------------------------------------
// Local Intelligent Simulator (Fallback when FastAPI is offline)
// ---------------------------------------------------------------------------

function simulateBotResponse(
  userText: string,
  currentState: ChatSessionState,
): { replyText: string; nextState: ChatSessionState } {
  const lower = userText.toLowerCase();

  let detectedCategory: CategoryId = (currentState.category as CategoryId) ?? 'OTHER';
  let detectedSubcategory = currentState.subcategory;

  // Category detection heuristic
  if (
    lower.includes('water') ||
    lower.includes('geyser') ||
    lower.includes('mess') ||
    lower.includes('food') ||
    lower.includes('warden') ||
    lower.includes('hostel')
  ) {
    detectedCategory = 'HOSTEL';
    if (lower.includes('water') || lower.includes('geyser')) detectedSubcategory = 'HOSTEL_WATER';
    else if (lower.includes('mess') || lower.includes('food')) detectedSubcategory = 'HOSTEL_MESS';
  } else if (
    lower.includes('wifi') ||
    lower.includes('wi-fi') ||
    lower.includes('internet') ||
    lower.includes('portal') ||
    lower.includes('computer') ||
    lower.includes('lab')
  ) {
    detectedCategory = 'IT_SERVICES';
    if (lower.includes('wifi') || lower.includes('internet')) detectedSubcategory = 'IT_WIFI';
    else if (lower.includes('lab') || lower.includes('computer')) detectedSubcategory = 'IT_LAB';
  } else if (
    lower.includes('road') ||
    lower.includes('street') ||
    lower.includes('light') ||
    lower.includes('electricity') ||
    lower.includes('power cut') ||
    lower.includes('structure')
  ) {
    detectedCategory = 'INFRASTRUCTURE';
    if (lower.includes('electricity') || lower.includes('light'))
      detectedSubcategory = 'ELECTRICITY';
    else if (lower.includes('road')) detectedSubcategory = 'ROAD';
  } else if (
    lower.includes('washroom') ||
    lower.includes('toilet') ||
    lower.includes('garbage') ||
    lower.includes('waste') ||
    lower.includes('clean')
  ) {
    detectedCategory = 'HYGIENE';
    if (lower.includes('washroom') || lower.includes('toilet'))
      detectedSubcategory = 'HYGIENE_WASHROOM';
    else if (lower.includes('waste') || lower.includes('garbage'))
      detectedSubcategory = 'HYGIENE_WASTE';
  } else if (
    lower.includes('ragging') ||
    lower.includes('harass') ||
    lower.includes('security') ||
    lower.includes('guard')
  ) {
    detectedCategory = 'SAFETY';
    if (lower.includes('ragging')) detectedSubcategory = 'SAFETY_RAGGING';
    else if (lower.includes('harass')) detectedSubcategory = 'SAFETY_HARASSMENT';
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
  }

  // Location detection heuristic
  let locationLabel = currentState.draftIssue?.location.label ?? '';
  if (!locationLabel) {
    if (lower.includes('hostel 1')) locationLabel = 'Boys Hostel Block 1';
    else if (lower.includes('hostel 2')) locationLabel = 'Boys Hostel Block 2';
    else if (lower.includes('hostel 3')) locationLabel = 'Boys Hostel Block 3';
    else if (lower.includes('hostel 4')) locationLabel = 'Boys Hostel Block 4';
    else if (lower.includes('girls hostel')) locationLabel = 'Girls Hostel Cluster';
    else if (lower.includes('library')) locationLabel = 'Central Library';
    else if (lower.includes('tech') || lower.includes('it dept') || lower.includes('engineering'))
      locationLabel = 'School of Technology (Engineering Block)';
    else if (lower.includes('science')) locationLabel = 'Science Complex';
    else if (lower.includes('admin')) locationLabel = 'Administrative Block';
  }

  // If this is the first turn and location is still missing, ask for location
  if (!locationLabel && !currentState.complete) {
    return {
      replyText: `Got it, that falls under **${detectedCategory.replace('_', ' ')}**. Could you tell me where exactly on campus this is happening (e.g. which hostel, department, or floor)?`,
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

  // If location is provided or already known, synthesize the complete draft!
  const finalLocation = locationLabel || 'NEHU Campus, Shillong';
  const categoryMeta = ISSUE_CATEGORIES.find((c) => c.id === detectedCategory);
  const categoryLabel = categoryMeta ? categoryMeta.label : detectedCategory;

  const generatedTitle = `${categoryLabel} grievance reported at ${finalLocation}`;
  const generatedDescription = currentState.draftIssue
    ? `${currentState.draftIssue.description} Additional context: ${userText}`
    : `Student reported campus grievance: "${userText}". Priority redressal requested at ${finalLocation}.`;

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

  return {
    replyText:
      "I've synthesized your complaint into an official grievance draft below. Please review the categorized details and tap 'Confirm & Submit' to send it directly to university administration.",
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
