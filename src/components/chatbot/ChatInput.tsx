/**
 * ChatInput Component — src/components/chatbot/ChatInput.tsx
 *
 * Canva-inspired chat input bar with multiline text field,
 * quick suggestion prompts, character limit counter, and send button.
 */

import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LIMITS } from '@/constants/limits';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';

export interface ChatInputProps {
  readonly onSend: (text: string) => void;
  readonly isTyping?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly placeholder?: string | undefined;
  readonly quickPrompts?: readonly string[] | undefined;
  readonly onSelectPrompt?: ((prompt: string) => void) | undefined;
}

export function ChatInput({
  onSend,
  isTyping = false,
  disabled = false,
  placeholder = 'Describe your campus issue in everyday words...',
  quickPrompts,
  onSelectPrompt,
}: ChatInputProps) {
  const [text, setText] = useState('');

  const canSend = text.trim().length > 0 && !isTyping && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    const messageToSend = text.trim();
    setText('');
    onSend(messageToSend);
  };

  const handlePromptPress = (prompt: string) => {
    if (onSelectPrompt) {
      onSelectPrompt(prompt);
    } else {
      setText(prompt);
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Quick Suggestion Chips (if available and input is short) */}
      {quickPrompts && quickPrompts.length > 0 && text.length === 0 && (
        <View style={styles.quickPromptsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickPromptsScroll}
            keyboardShouldPersistTaps="handled"
          >
            {quickPrompts.map((prompt) => (
              <Pressable
                key={prompt}
                onPress={() => handlePromptPress(prompt)}
                style={({ pressed }) => [styles.promptChip, pressed && { opacity: 0.75 }]}
                accessibilityRole="button"
              >
                <Ionicons name="chatbubble-ellipses-outline" size={12} color={COLORS.primary} />
                <Text style={styles.promptChipText}>{prompt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Main Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray400}
          multiline
          maxLength={LIMITS.CHATBOT_MESSAGE_MAX_CHARS}
          editable={!disabled && !isTyping}
          returnKeyType="default"
        />

        {/* Send Action Button */}
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={({ pressed }) => [
            styles.sendButton,
            canSend ? styles.sendButtonActive : styles.sendButtonDisabled,
            pressed && canSend && { opacity: 0.8 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Ionicons name="arrow-up" size={20} color={canSend ? COLORS.white : COLORS.gray400} />
        </Pressable>
      </View>

      {/* Subtle Character Counter if typing gets long */}
      {text.length > 300 && (
        <Text style={styles.charCountText}>
          {text.length} / {LIMITS.CHATBOT_MESSAGE_MAX_CHARS}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xs,
    paddingBottom: Platform.OS === 'ios' ? SPACING.md : SPACING.sm,
  },
  quickPromptsContainer: {
    marginBottom: SPACING.xs + 2,
  },
  quickPromptsScroll: {
    gap: SPACING.xs,
    paddingVertical: 2,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primarySubtle,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  promptChipText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 11,
    color: COLORS.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    paddingLeft: SPACING.md,
    paddingRight: SPACING.xs,
    paddingVertical: Platform.OS === 'ios' ? 6 : 4,
    minHeight: 46,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  textInput: {
    flex: 1,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray900,
    paddingTop: Platform.OS === 'ios' ? 6 : 4,
    paddingBottom: Platform.OS === 'ios' ? 6 : 4,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
  sendButtonActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray200,
  },
  charCountText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 10,
    color: COLORS.gray400,
    alignSelf: 'flex-end',
    marginTop: 2,
    marginRight: SPACING.xs,
  },
});
