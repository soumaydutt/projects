import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ScreenFlatList } from '@/components/ScreenFlatList';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';

interface Alert {
  id: string;
  patient: string;
  type: 'missed' | 'low_adherence' | 'critical';
  message: string;
  time: string;
}

const mockAlerts: Alert[] = [
  { id: '1', patient: 'Emma Wilson', type: 'critical', message: 'Missed 2 doses today', time: '1 hour ago' },
  { id: '2', patient: 'Michael Chen', type: 'low_adherence', message: 'Adherence dropped to 68%', time: '3 hours ago' },
  { id: '3', patient: 'Soumay', type: 'missed', message: 'Evening dose missed', time: '5 hours ago' },
  { id: '4', patient: 'Maria Garcia', type: 'low_adherence', message: 'Adherence below 75%', time: '1 day ago' },
];

export default function AlertsScreen() {
  const { colors } = useTheme();

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return colors.error;
      case 'low_adherence':
        return colors.warning;
      case 'missed':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return 'alert-circle';
      case 'low_adherence':
        return 'trending-down';
      case 'missed':
        return 'clock';
      default:
        return 'bell';
    }
  };

  const renderAlert = ({ item }: { item: Alert }) => (
    <ThemedView style={[styles.alertCard, Shadow.card]}>
      <View style={styles.alertHeader}>
        <View
          style={[
            styles.alertIcon,
            { backgroundColor: getAlertColor(item.type) + '20' },
          ]}
        >
          <Feather
            name={getAlertIcon(item.type) as any}
            size={20}
            color={getAlertColor(item.type)}
          />
        </View>
        <View style={styles.alertContent}>
          <ThemedText style={styles.patientName}>{item.patient}</ThemedText>
          <ThemedText style={styles.alertMessage}>{item.message}</ThemedText>
          <ThemedText style={[styles.alertTime, { color: colors.textSecondary }]}>
            {item.time}
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );

  return (
    <ScreenFlatList
      data={mockAlerts}
      renderItem={renderAlert}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View style={styles.header}>
          <ThemedText style={styles.title}>Alerts</ThemedText>
          <View style={[styles.badge, { backgroundColor: colors.error }]}>
            <ThemedText style={[styles.badgeText, { color: '#FFFFFF' }]}>
              {mockAlerts.length}
            </ThemedText>
          </View>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.title1,
  },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  badgeText: {
    ...Typography.footnote,
    fontWeight: '700',
  },
  alertCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  alertHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  patientName: {
    ...Typography.headline,
  },
  alertMessage: {
    ...Typography.body,
  },
  alertTime: {
    ...Typography.footnote,
  },
});
