import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { StatCard } from '@/components/StatCard';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';

export default function CaregiverDashboardScreen() {
  const { colors } = useTheme();

  return (
    <ScreenScrollView style={{ backgroundColor: colors.backgroundDefault }}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Dashboard</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          Overview of your patients
        </ThemedText>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Total Patients"
          value="12"
          icon="users"
          iconColor={colors.primary}
          style={styles.statCard}
        />
        <StatCard
          title="Active Today"
          value="10"
          icon="activity"
          iconColor={colors.success}
          style={styles.statCard}
        />
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Alerts"
          value="3"
          subtitle="Require attention"
          icon="alert-circle"
          iconColor={colors.error}
          style={styles.statCard}
        />
        <StatCard
          title="Avg. Adherence"
          value="89%"
          subtitle="This month"
          icon="trending-up"
          iconColor={colors.warning}
          style={styles.statCard}
        />
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Recent AI Insights</ThemedText>

        <ThemedView style={[styles.insightCard, Shadow.card]}>
          <View style={styles.insightHeader}>
            <View style={[styles.insightIcon, { backgroundColor: colors.success + '20' }]}>
              <Feather name="trending-up" size={20} color={colors.success} />
            </View>
            <ThemedText style={styles.insightTitle}>Positive Trend</ThemedText>
          </View>
          <ThemedText style={[styles.insightText, { color: colors.textSecondary }]}>
            Overall patient adherence improved by 7% this week. Keep up the great work!
          </ThemedText>
        </ThemedView>

        <ThemedView style={[styles.insightCard, Shadow.card]}>
          <View style={styles.insightHeader}>
            <View style={[styles.insightIcon, { backgroundColor: colors.warning + '20' }]}>
              <Feather name="clock" size={20} color={colors.warning} />
            </View>
            <ThemedText style={styles.insightTitle}>Peak Missed Time</ThemedText>
          </View>
          <ThemedText style={[styles.insightText, { color: colors.textSecondary }]}>
            Most missed doses occur between 8-10 PM. Consider adjusting evening medication schedules.
          </ThemedText>
        </ThemedView>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Patients Requiring Attention</ThemedText>

        <ThemedView style={[styles.patientCard, Shadow.card]}>
          <View style={styles.patientInfo}>
            <View style={[styles.patientAvatar, { backgroundColor: colors.error + '20' }]}>
              <Feather name="user" size={20} color={colors.error} />
            </View>
            <View>
              <ThemedText style={styles.patientName}>Emma Wilson</ThemedText>
              <ThemedText style={[styles.patientStatus, { color: colors.error }]}>
                Missed 2 doses today
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        <ThemedView style={[styles.patientCard, Shadow.card]}>
          <View style={styles.patientInfo}>
            <View style={[styles.patientAvatar, { backgroundColor: colors.warning + '20' }]}>
              <Feather name="user" size={20} color={colors.warning} />
            </View>
            <View>
              <ThemedText style={styles.patientName}>Michael Chen</ThemedText>
              <ThemedText style={[styles.patientStatus, { color: colors.warning }]}>
                Low adherence (68%)
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.title1,
  },
  subtitle: {
    ...Typography.body,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.title2,
    marginBottom: Spacing.lg,
  },
  insightCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightTitle: {
    ...Typography.headline,
  },
  insightText: {
    ...Typography.callout,
  },
  patientCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientName: {
    ...Typography.headline,
  },
  patientStatus: {
    ...Typography.callout,
  },
});
