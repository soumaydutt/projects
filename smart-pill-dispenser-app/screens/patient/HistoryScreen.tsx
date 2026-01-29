import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ScreenFlatList } from '@/components/ScreenFlatList';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';

interface DoseLog {
  id: string;
  medication: string;
  dosage: string;
  time: string;
  status: 'taken' | 'missed' | 'upcoming';
  date: string;
}

const mockDoseLogs: DoseLog[] = [
  { id: '1', medication: 'Aspirin', dosage: '100mg', time: '08:00 AM', status: 'taken', date: 'Today' },
  { id: '2', medication: 'Vitamin D', dosage: '2000 IU', time: '12:00 PM', status: 'upcoming', date: 'Today' },
  { id: '3', medication: 'Aspirin', dosage: '100mg', time: '08:00 PM', status: 'upcoming', date: 'Today' },
  { id: '4', medication: 'Aspirin', dosage: '100mg', time: '08:00 PM', status: 'taken', date: 'Yesterday' },
  { id: '5', medication: 'Vitamin D', dosage: '2000 IU', time: '12:00 PM', status: 'taken', date: 'Yesterday' },
  { id: '6', medication: 'Aspirin', dosage: '100mg', time: '08:00 AM', status: 'missed', date: '2 days ago' },
  { id: '7', medication: 'Vitamin D', dosage: '2000 IU', time: '12:00 PM', status: 'taken', date: '2 days ago' },
  { id: '8', medication: 'Aspirin', dosage: '100mg', time: '08:00 PM', status: 'taken', date: '3 days ago' },
];

export default function HistoryScreen() {
  const { colors } = useTheme();

  const renderDoseLog = ({ item }: { item: DoseLog }) => (
    <ThemedView style={[styles.logCard, Shadow.card]}>
      <View style={styles.logHeader}>
        <View>
          <ThemedText style={styles.medicationName}>{item.medication}</ThemedText>
          <ThemedText style={[styles.dosage, { color: colors.textSecondary }]}>
            {item.dosage}
          </ThemedText>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === 'taken'
                  ? colors.success + '20'
                  : item.status === 'missed'
                  ? colors.error + '20'
                  : colors.primary + '20',
            },
          ]}
        >
          <Feather
            name={
              item.status === 'taken'
                ? 'check-circle'
                : item.status === 'missed'
                ? 'x-circle'
                : 'clock'
            }
            size={16}
            color={
              item.status === 'taken'
                ? colors.success
                : item.status === 'missed'
                ? colors.error
                : colors.primary
            }
          />
          <ThemedText
            style={[
              styles.statusText,
              {
                color:
                  item.status === 'taken'
                    ? colors.success
                    : item.status === 'missed'
                    ? colors.error
                    : colors.primary,
              },
            ]}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </ThemedText>
        </View>
      </View>
      <View style={styles.logFooter}>
        <ThemedText style={[styles.timeText, { color: colors.textSecondary }]}>
          {item.time} • {item.date}
        </ThemedText>
      </View>
    </ThemedView>
  );

  return (
    <ScreenFlatList
      data={mockDoseLogs}
      renderItem={renderDoseLog}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <ThemedText style={styles.title}>Dose History</ThemedText>
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
  logCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  medicationName: {
    ...Typography.headline,
  },
  dosage: {
    ...Typography.callout,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  statusText: {
    ...Typography.footnote,
    fontWeight: '600',
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    ...Typography.footnote,
  },
});
