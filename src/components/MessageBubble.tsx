/**
 * 消息气泡组件
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Message } from '@types';
import { Colors, Spacing, FontSizes, BorderRadius } from '@constants';
import { formatTimestamp } from '@utils/helpers';

interface MessageBubbleProps {
  message: Message;
  onLongPress?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onLongPress,
}) => {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.container, isUser && styles.userContainer]}>
      <TouchableOpacity
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.text,
            isUser ? styles.userText : styles.assistantText,
          ]}
        >
          {message.content}
        </Text>

        <Text style={[styles.time, isUser && styles.userTime]}>
          {formatTimestamp(message.timestamp, 'HH:mm')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },

  userContainer: {
    justifyContent: 'flex-end',
  },

  bubble: {
    maxWidth: '75%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },

  userBubble: {
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 4,
  },

  assistantBubble: {
    backgroundColor: Colors.light.surface,
    borderBottomLeftRadius: 4,
  },

  text: {
    fontSize: FontSizes.md,
    lineHeight: 20,
  },

  userText: {
    color: '#fff',
  },

  assistantText: {
    color: Colors.light.text,
  },

  time: {
    fontSize: FontSizes.xs,
    color: Colors.light.textSecondary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },

  userTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
