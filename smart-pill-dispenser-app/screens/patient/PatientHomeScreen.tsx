import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { StatCard } from '@/components/StatCard';
import { CountdownTimer } from '@/components/CountdownTimer';
import { HealthScoreGauge } from '@/components/HealthScoreGauge';
import { BadgeDisplay } from '@/components/BadgeDisplay';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { useMemo } from 'react';

export default function PatientHomeScreen() {
  const { colors } = useTheme();

  const nextDoseTime = useMemo(() => {
    const now = new Date();
    now.setHours(now.getHours() + 2);
    now.setMinutes(30);
    now.setSeconds(0);
    return now;
  }, []);

  const compartments = useMemo(
    () => [
      { id: 'A', medication: 'Aspirin 100mg', pillsRemaining: 12, dailyDoses: 2 },
      { id: 'B', medication: 'Metformin 500mg', pillsRemaining: 6, dailyDoses: 2 },
      { id: 'C', medication: 'Lisinopril 10mg', pillsRemaining: 18, dailyDoses: 1 },
    ],
    []
  );

  const handleSOSPress = () => {
    console.log('SOS button pressed');
  };

  return (
    <ScreenScrollView style={{ backgroundColor: colors.backgroundDefault }}>
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.greeting}>Hello,</ThemedText>
          <ThemedText style={styles.name}>Soumay</ThemedText>
        </View>
        <Pressable style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
          <Feather name="user" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ThemedView style={[styles.doseCard, Shadow.card]}>
        <CountdownTimer targetTime={nextDoseTime} />
        <ThemedText style={[styles.medicationName, { color: colors.textSecondary }]}>
          Aspirin 100mg
        </ThemedText>
      </ThemedView>

      <View style={styles.scoreSection}>
        <ThemedText style={styles.sectionTitle}>Your Health Score</ThemedText>
        <View style={styles.scoreContainer}>
          <HealthScoreGauge score={87} />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Refill Reminders</ThemedText>
        <View style={styles.refillGrid}>
          {compartments.map((compartment) => {
            const daysLeft = Math.max(0, Math.ceil(compartment.pillsRemaining / compartment.dailyDoses));
            const isUrgent = daysLeft <= 2;
            const isSoon = daysLeft <= 5 && !isUrgent;

            return (
              <ThemedView
                key={compartment.id}
                style={[
                  styles.refillCard,
                  Shadow.card,
                  { borderColor: isUrgent ? colors.error : isSoon ? colors.warning : colors.backgroundTertiary },
                ]}
              >
                <View style={styles.refillHeader}>
                  <View style={[styles.compartmentTag, { backgroundColor: colors.primary + '20' }]}>
                    <ThemedText style={[styles.compartmentText, { color: colors.primary }]}>
                      Compartment {compartment.id}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.daysLeft, { color: isUrgent ? colors.error : colors.text }]}>
                    {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                  </ThemedText>
                </View>
                <ThemedText style={styles.medName}>{compartment.medication}</ThemedText>
                <ThemedText style={[styles.remaining, { color: colors.textSecondary }]}>
                  {compartment.pillsRemaining} pills remaining · {compartment.dailyDoses}/day
                </ThemedText>
                <View style={styles.badgeRow}>
                  {isUrgent && (
                    <ThemedText style={[styles.statusBadge, { color: colors.error, borderColor: colors.error }]}>
                      Refill now
                    </ThemedText>
                  )}
                  {isSoon && !isUrgent && (
                    <ThemedText style={[styles.statusBadge, { color: colors.warning, borderColor: colors.warning }]}>
                      Refill soon
                    </ThemedText>
                  )}
                  {!isUrgent && !isSoon && (
                    <ThemedText style={[styles.statusBadge, { color: colors.textSecondary, borderColor: colors.backgroundTertiary }]}>
                      On track
                    </ThemedText>
                  )}
                </View>
              </ThemedView>
            );
          })}
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Current Streak"
          value="12 days"
          icon="zap"
          iconColor={colors.warning}
          style={styles.statCard}
        />
        <StatCard
          title="This Month"
          value="94%"
          subtitle="Adherence rate"
          icon="check-circle"
          iconColor={colors.success}
          style={styles.statCard}
        />
      </View>

      <View style={styles.badgesSection}>
        <ThemedText style={styles.sectionTitle}>Recent Achievements</ThemedText>
        <View style={styles.badgesGrid}>
          <BadgeDisplay
            title="7-Day Streak"
            image={require('@/assets/badges/seven_day_streak_badge.png')}
            unlocked
          />
          <BadgeDisplay
            title="Perfect Week"
            image={require('@/assets/badges/perfect_week_badge.png')}
            unlocked
          />
          <BadgeDisplay
            title="30-Day Streak"
            image={require('@/assets/badges/thirty_day_streak_badge.png')}
            unlocked={false}
          />
        </View>
      </View>

      <Pressable 
        style={[styles.sosButton, Shadow.fab, { backgroundColor: colors.error }]}
        onPress={handleSOSPress}
      >
        <Feather name="alert-circle" size={28} color="#FFFFFF" />
      </Pressable>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  greeting: {
    ...Typography.callout,
    opacity: 0.8,
  },
  name: {
    ...Typography.title1,
    fontWeight: '700',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doseCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  medicationName: {
    ...Typography.callout,
    textAlign: 'center',
  },
  scoreSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.title2,
    marginBottom: Spacing.lg,
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
  },
  badgesSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing['5xl'],
  },
  badgesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  sosButton: {
    position: 'absolute',
    bottom: 120,
    right: Spacing.xl,
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  refillGrid: {
    gap: Spacing.md,
  },
  refillCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  refillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  compartmentTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  compartmentText: {
    ...Typography.footnote,
  },
  daysLeft: {
    ...Typography.callout,
    fontWeight: '600',
  },
  medName: {
    ...Typography.headline,
    marginBottom: Spacing.xs,
  },
  remaining: {
    ...Typography.callout,
    marginBottom: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statusBadge: {
    ...Typography.footnote,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
});
