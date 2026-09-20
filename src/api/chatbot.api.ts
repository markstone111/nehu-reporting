/**
 * Chatbot API Module
 *
 * The mobile app is a THIN CLIENT for the chatbot — it sends raw user text
 * to the FastAPI backend and receives a bot reply + session state.
 * The FastAPI backend owns all LLM provider logic (Gemini / Groq / OpenAI).
 *
 * Session lifecycle:
 *   1. User opens chatbot screen → no session yet.
 *   2. First message: sessionId = null. Server creates a session and returns sessionId.
 *   3. Subsequent messages: pass the sessionId and current sessionState back.
 *   4. When sessionState.complete = true: show draft review card.
 *   5. User confirms → call issuesApi.submit() with the draft issue.
 *
 * Endpoints:
 *   POST /chatbot/message — Send a message, receive bot reply + session state
 *   DELETE /chatbot/:sessionId — Abandon a session (called on chatbot screen exit)
 */

import { apiClient } from '@/api/client';
import { API_TIMEOUTS } from '@/constants/limits';
import type { ChatMessageRequest, ChatMessageResponse } from '@/types/api.types';

export const chatbotApi = {
  /**
   * Send a user message and receive the bot's reply.
   *
   * Uses CHATBOT timeout (30s) since LLM responses can take longer.
   * The sessionState returned from the server should be stored locally
   * and passed back on the next call.
   */
  sendMessage: async (data: ChatMessageRequest): Promise<ChatMessageResponse> => {
    const response = await apiClient.post<ChatMessageResponse>('/chatbot/message', data, {
      timeout: API_TIMEOUTS.CHATBOT,
    });
    return response.data;
  },

  /**
   * Abandon an in-progress chatbot session.
   * Call this when the user navigates away from the chatbot screen mid-session.
   * The server can then clean up any in-memory session state.
   */
  abandonSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/chatbot/${sessionId}`).catch(() => {
      // Best-effort — if this fails, don't block the user from leaving
    });
  },
};
