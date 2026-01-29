import { View, StyleSheet, TextInput, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ScreenFlatList } from '@/components/ScreenFlatList';
import { useTheme } from '@/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { assistantFAQs } from '@/constants/assistantFAQs';

interface Message {
  id: string;
  text: string;
  sender: 'patient' | 'assistant' | 'caregiver';
  time: string;
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: 'Hi Soumay, I’m your PillCare assistant. Ask me about doses, refills, side effects, or schedule changes.',
    sender: 'assistant',
    time: 'Just now',
  },
  {
    id: '2',
    text: 'Need a quick summary? I can check refill timing, when to take meds with food, or what to do if you miss a dose.',
    sender: 'assistant',
    time: 'Just now',
  },
];

export default function ChatScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [assistantTyping, setAssistantTyping] = useState(false);

  const quickPrompts = useMemo(
    () => [
      'When should I refill each compartment?',
      'Can I take aspirin with food?',
      'What do I do if I miss a dose?',
      'Any interactions with caffeine?',
    ],
    []
  );

  const formatTime = () => {
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    return `${hours}:${minutes} ${ampm}`;
  };

  const getAssistantResponse = (text: string) => {
    const lower = text.toLowerCase();

    // Quick similarity score by tag/keyword overlap.
    const terms = lower.split(/\s+/).filter(Boolean);
    let best = assistantFAQs[0];
    let bestScore = 0;

    for (const item of assistantFAQs) {
      const q = (item.question + ' ' + (item.tags || []).join(' ')).toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (q.includes(term)) score += 1;
      }
      if (q.includes(lower)) score += 3; // full phrase bonus
      if (score > bestScore) {
        best = item;
        bestScore = score;
      }
    }

    if (bestScore === 0) {
      return 'I can help with refills, dosing times, missed doses, interactions, and schedule tweaks. Tell me the med name and your question.';
    }

    return best.answer;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isPatient = item.sender === 'patient';
    const isAssistant = item.sender === 'assistant';
    
    return (
      <View style={[styles.messageContainer, (isPatient || isAssistant) && styles.patientMessage]}>
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isPatient
                ? colors.primary
                : isAssistant
                ? colors.backgroundSecondary
                : colors.card,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.messageText,
              { color: isPatient ? '#FFFFFF' : colors.text },
            ]}
          >
            {item.text}
          </ThemedText>
          <ThemedText
            style={[
              styles.timeText,
              { color: isPatient ? '#FFFFFF' + 'CC' : colors.textSecondary },
            ]}
          >
            {item.time}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundDefault }]}>
      <ScreenFlatList
        data={messages.slice().reverse()}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={styles.listContent}
      />

      <View style={[styles.quickActions, { borderTopColor: colors.backgroundTertiary }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsContent}>
          {quickPrompts.map((prompt) => (
            <Pressable
              key={prompt}
              style={[styles.chip, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => setMessageText(prompt)}
            >
              <ThemedText style={[styles.chipText, { color: colors.text }]}>{prompt}</ThemedText>
            </Pressable>
          ))}
        </ScrollView>
        {assistantTyping && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <ThemedText style={[styles.typingText, { color: colors.textSecondary }]}>
              Assistant is thinking...
            </ThemedText>
          </View>
        )}
      </View>

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.card,
            paddingBottom: insets.bottom + Spacing.md,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.backgroundTertiary,
              color: colors.text,
            },
          ]}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
          value={messageText}
          onChangeText={setMessageText}
          multiline
        />
        <Pressable
          style={[styles.sendButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            if (messageText.trim()) {
              const now = formatTime();
              const newMessage: Message = {
                id: `${Date.now()}`,
                text: messageText.trim(),
                sender: 'patient',
                time: now,
              };

              setMessages((prev) => [...prev, newMessage]);
              setMessageText('');

              setAssistantTyping(true);
              const replyText = getAssistantResponse(messageText);
              setTimeout(() => {
                const reply: Message = {
                  id: `${Date.now()}-ai`,
                  text: replyText,
                  sender: 'assistant',
                  time: formatTime(),
                };
                setMessages((prev) => [...prev, reply]);
                setAssistantTyping(false);
              }, 650);

              console.log('Send:', messageText);
              setMessageText('');
            }
          }}
        >
          <Feather name="send" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.lg,
  },
  messageContainer: {
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  patientMessage: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  messageText: {
    ...Typography.body,
    marginBottom: Spacing.xs,
  },
  timeText: {
    ...Typography.footnote,
    fontSize: 11,
  },
  quickActions: {
    borderTopWidth: 1,
    paddingVertical: Spacing.sm,
  },
  quickActionsContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipText: {
    ...Typography.footnote,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  typingText: {
    ...Typography.footnote,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  input: {
    flex: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    maxHeight: 100,
    ...Typography.body,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
