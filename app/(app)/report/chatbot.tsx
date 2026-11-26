/**
 * AI Chatbot Reporter Screen — app/(app)/report/chatbot.tsx
 *
 * Conversational grievance triage powered by Soumojit's FastAPI microservice
 * and LLM reasoning. Allows students to report issues in natural English,
 * campus slang, or WhatsApp-style text. The assistant extracts category,
 * campus location, and description, presenting a structured Draft Review Card
 * for 1-tap submission.
 */

import { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { ChatBubble, ChatInput, TypingIndicator, DraftReviewCard } from '@/components/chatbot';
import { useChatbot } from '@/hooks/useChatbot';
import { useSubmitIssue } from '@/hooks/useIssues';
import { useAuthStore } from '@/store/auth.store';
import { capitalize } from '@/utils/text.utils';
import { getErrorMessage } from '@/utils/error.utils';
import type { ChatMessage, SubmitIssueRequest } from '@/types/api.types';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';

const QUICK_PROMPTS = [
  'No drinking water on 2nd floor of Boys Hostel 2',
  'WiFi keeps disconnecting in Central Library',
  'Streetlight broken on Science Complex road',
  'Washroom taps leaking in Tech Block',
] as const;

export default function ChatbotReportScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const { messages, sessionState, isTyping, sendMessage, requestMoreDetails, resetSession } =
    useChatbot();

  const submitIssueMutation = useSubmitIssue();

  // Guard against accidental reset
  const handleConfirmReset = () => {
    if (messages.length <= 1 && !sessionState.draftIssue) {
      resetSession();
      return;
    }
    Alert.alert(
      'Reset Conversation?',
      'Are you sure you want to start over? All messages and your grievance draft will be cleared.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Over', style: 'destructive', onPress: resetSession },
      ],
    );
  };

  // Scroll to bottom immediately on next animation frame when new messages arrive
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(frameId);
  }, [messages.length, isTyping, sessionState.complete]);

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);
  const renderMessageItem = useCallback(
    ({ item }: { item: ChatMessage }) => <ChatBubble message={item} />,
    [],
  );

  // Submit the AI-generated draft
  const handleSubmitDraft = async () => {
    if (!sessionState.draftIssue) return;

    const draft = sessionState.draftIssue;

    const payload: SubmitIssueRequest = {
      title: draft.title,
      category: draft.category,
      subcategory: draft.subcategory,
      description: draft.description,
      location: draft.location,
      attachments: [],
      source: 'CHATBOT',
      metadata: {
        appVersion: '1.0.0',
        platform: 'android',
      },
    };

    try {
      const response = await submitIssueMutation.mutateAsync(payload);

      if (response.isDuplicate) {
        Alert.alert(
          'Linked to Existing Issue',
          'University administration already has an open complaint matching this issue. Your report has been grouped for priority redressal.',
          [
            {
              text: 'View Status',
              onPress: () => {
                router.replace({
                  pathname: '/(app)/issues/[id]',
                  params: { id: response.issueId },
                });
              },
            },
          ],
        );
      } else {
        Alert.alert(
          'Grievance Filed Successfully',
          `Your report has been queued under tracking reference #${response.issueId.slice(0, 8).toUpperCase()}.`,
          [
            {
              text: 'Track Grievance',
              onPress: () => {
                router.replace({
                  pathname: '/(app)/issues/[id]',
                  params: { id: response.issueId },
                });
              },
            },
          ],
        );
      }
    } catch (err: unknown) {
      const message = getErrorMessage(
        err,
        'Unable to submit grievance. Please verify your connection.',
      );
      Alert.alert('Submission Error', message);
    }
  };

  const displayName = user?.name ?? 'NEHU Student';
  const roleDisplay = user?.role ? capitalize(user.role) : 'Verified Student';

  return (
    <ScreenWrapper scrollable={false} backgroundColor={COLORS.gray50}>
      <Header
        title="AI Grievance Assistant"
        subtitle="Conversational Issue Redressal"
        showBack
        rightElement={
          <Pressable
            onPress={handleConfirmReset}
            hitSlop={8}
            style={styles.headerResetButton}
            accessibilityRole="button"
            accessibilityLabel="Reset conversation"
          >
            <Ionicons name="refresh" size={20} color={COLORS.gray700} />
          </Pressable>
        }
      />

      {/* Verified Student Identity Banner */}
      <View style={styles.identityStrip}>
        <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
        <Text style={styles.identityStripText}>
          Filing verified grievance as <Text style={styles.boldText}>{displayName}</Text> (
          {roleDisplay})
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={keyExtractor}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={12}
          maxToRenderPerBatch={8}
          windowSize={7}
          ListFooterComponent={
            <View>
              {isTyping && <TypingIndicator />}

              {sessionState.complete && sessionState.draftIssue && (
                <DraftReviewCard
                  draft={sessionState.draftIssue}
                  onSubmit={handleSubmitDraft}
                  onKeepChatting={requestMoreDetails}
                  onReset={handleConfirmReset}
                  isSubmitting={submitIssueMutation.isPending}
                />
              )}
            </View>
          }
        />

        {/* Chat Input Bar */}
        <ChatInput
          onSend={sendMessage}
          isTyping={isTyping}
          disabled={isTyping}
          placeholder={
            sessionState.complete
              ? 'Add more details or clarify anything...'
              : 'Describe the problem in everyday words...'
          }
          quickPrompts={messages.length === 1 ? QUICK_PROMPTS : undefined}
          onSelectPrompt={(prompt) => sendMessage(prompt)}
        />
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerResetButton: {
    padding: SPACING.xxs,
  },
  identityStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primarySubtle,
    paddingHorizontal: SPACING.base,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  },
  identityStripText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: COLORS.gray700,
    flex: 1,
  },
  boldText: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: COLORS.primary,
  },
  keyboardContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.base,
  },
});
