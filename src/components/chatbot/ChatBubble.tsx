/**
 * ChatBubble Component — src/components/chatbot/ChatBubble.tsx
 *
 * Canva-inspired chat bubble for user, AI assistant, and system messages.
 * Supports distinct speech bubbles, avatar chips, and formatted timestamps.
 */

import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ChatMessage } from '@/types/api.types';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';

export interface ChatBubbleProps {
  readonly message: ChatMessage;
}

export const ChatBubble = memo(function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <View style={styles.systemContainer}>
        <View style={styles.systemBubble}>
          <Ionicons name="information-circle-outline" size={13} color={COLORS.gray500} />
          <Text style={styles.systemText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  // Format timestamp (e.g., 04:35 PM)
  const timeString = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.row, isUser ? styles.userRow : styles.assistantRow]}>
      {/* Assistant Avatar */}
      {!isUser && (
        <View style={styles.assistantAvatarCircle}>
          <Ionicons name="sparkles" size={13} color={COLORS.accent} />
        </View>
      )}

      {/* Bubble Container */}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
          {message.content}
        </Text>

        <Text style={[styles.timeText, isUser ? styles.userTimeText : styles.assistantTimeText]}>
          {timeString}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  assistantAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accentLight,
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs + 2,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  assistantBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  messageText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.45,
  },
  userText: {
    color: COLORS.white,
  },
  assistantText: {
    color: COLORS.gray900,
  },
  timeText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimeText: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  assistantTimeText: {
    color: COLORS.gray400,
  },
  systemContainer: {
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  systemBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.gray100,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  systemText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 11,
    color: COLORS.gray600,
  },
});
