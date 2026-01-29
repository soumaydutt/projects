import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ScreenFlatList } from '@/components/ScreenFlatList';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';

interface Conversation {
  id: string;
  patient: string;
  lastMessage: string;
  time: string;
  unread: number;
}

const mockConversations: Conversation[] = [
  { id: '1', patient: 'Soumay', lastMessage: 'Thank you for the help!', time: '10:36 AM', unread: 0 },
  { id: '2', patient: 'Emma Wilson', lastMessage: 'I have a question about my medication.', time: 'Yesterday', unread: 2 },
  { id: '3', patient: 'Michael Chen', lastMessage: 'Can we schedule a call?', time: '2 days ago', unread: 1 },
  { id: '4', patient: 'Sarah Johnson', lastMessage: 'Everything is going well, thanks!', time: '3 days ago', unread: 0 },
];

export default function MessagesScreen() {
  const { colors } = useTheme();

  const renderConversation = ({ item }: { item: Conversation }) => (
    <Pressable>
      <ThemedView style={[styles.conversationCard, Shadow.card]}>
        <View style={styles.conversationHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <Feather name="user" size={24} color={colors.primary} />
          </View>
          <View style={styles.conversationContent}>
            <View style={styles.conversationTop}>
              <ThemedText style={styles.patientName}>{item.patient}</ThemedText>
              <ThemedText style={[styles.time, { color: colors.textSecondary }]}>
                {item.time}
              </ThemedText>
            </View>
            <View style={styles.conversationBottom}>
              <ThemedText
                style={[
                  styles.lastMessage,
                  { color: colors.textSecondary },
                  item.unread > 0 && { color: colors.text, fontWeight: '600' },
                ]}
                numberOfLines={1}
              >
                {item.lastMessage}
              </ThemedText>
              {item.unread > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                  <ThemedText style={[styles.unreadText, { color: '#FFFFFF' }]}>
                    {item.unread}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </View>
      </ThemedView>
    </Pressable>
  );

  return (
    <ScreenFlatList
      data={mockConversations}
      renderItem={renderConversation}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <ThemedText style={styles.title}>Messages</ThemedText>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: Spacing.xl,
  },
  title: {
    ...Typography.title1,
    marginBottom: Spacing.lg,
  },
  conversationCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  conversationTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientName: {
    ...Typography.headline,
  },
  time: {
    ...Typography.footnote,
  },
  conversationBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    ...Typography.callout,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  unreadText: {
    ...Typography.footnote,
    fontSize: 11,
    fontWeight: '700',
  },
});
