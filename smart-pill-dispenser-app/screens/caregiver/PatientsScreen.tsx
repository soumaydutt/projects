import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ScreenFlatList } from '@/components/ScreenFlatList';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';

interface Patient {
  id: string;
  name: string;
  adherence: number;
  status: 'good' | 'warning' | 'critical';
  lastActive: string;
}

const mockPatients: Patient[] = [
  { id: '1', name: 'Soumay', adherence: 94, status: 'good', lastActive: '2 hours ago' },
  { id: '2', name: 'Emma Wilson', adherence: 58, status: 'critical', lastActive: '5 hours ago' },
  { id: '3', name: 'Michael Chen', adherence: 68, status: 'warning', lastActive: '1 hour ago' },
  { id: '4', name: 'Sarah Johnson', adherence: 91, status: 'good', lastActive: '30 min ago' },
  { id: '5', name: 'David Lee', adherence: 87, status: 'good', lastActive: '1 hour ago' },
  { id: '6', name: 'Maria Garcia', adherence: 72, status: 'warning', lastActive: '3 hours ago' },
];

export default function PatientsScreen() {
  const { colors } = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'critical':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const renderPatient = ({ item }: { item: Patient }) => (
    <Pressable>
      <ThemedView style={[styles.patientCard, Shadow.card]}>
        <View style={styles.patientHeader}>
          <View style={styles.patientInfo}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
              <Feather name="user" size={24} color={colors.primary} />
            </View>
            <View>
              <ThemedText style={styles.patientName}>{item.name}</ThemedText>
              <ThemedText style={[styles.lastActive, { color: colors.textSecondary }]}>
                Last active: {item.lastActive}
              </ThemedText>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textSecondary} />
        </View>

        <View style={styles.adherenceContainer}>
          <View style={styles.adherenceInfo}>
            <ThemedText style={[styles.adherenceLabel, { color: colors.textSecondary }]}>
              Adherence
            </ThemedText>
            <ThemedText style={[styles.adherenceValue, { color: getStatusColor(item.status) }]}>
              {item.adherence}%
            </ThemedText>
          </View>
          <View style={[styles.adherenceBar, { backgroundColor: colors.backgroundTertiary }]}>
            <View
              style={[
                styles.adherenceProgress,
                {
                  width: `${item.adherence}%`,
                  backgroundColor: getStatusColor(item.status),
                },
              ]}
            />
          </View>
        </View>
      </ThemedView>
    </Pressable>
  );

  return (
    <ScreenFlatList
      data={mockPatients}
      renderItem={renderPatient}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <ThemedText style={styles.title}>My Patients</ThemedText>
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
  patientCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientName: {
    ...Typography.headline,
  },
  lastActive: {
    ...Typography.footnote,
  },
  adherenceContainer: {
    gap: Spacing.sm,
  },
  adherenceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adherenceLabel: {
    ...Typography.callout,
  },
  adherenceValue: {
    ...Typography.headline,
  },
  adherenceBar: {
    height: 6,
    borderRadius: BorderRadius.xs,
    overflow: 'hidden',
  },
  adherenceProgress: {
    height: '100%',
    borderRadius: BorderRadius.xs,
  },
});
