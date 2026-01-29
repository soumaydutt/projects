import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentMonth] = useState(new Date());

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, status: null });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const today = new Date();
      const currentDay = new Date(year, month, day);
      
      if (currentDay > today) {
        days.push({ day, status: 'upcoming' });
      } else {
        const status = Math.random() > 0.2 ? 'taken' : 'missed';
        days.push({ day, status });
      }
    }
    
    return days;
  };

  const days = getDaysInMonth();

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundDefault, paddingTop: insets.top + Spacing.xl, paddingBottom: 88 + Spacing.xl }]}>
      <View style={styles.header}>
        <ThemedText style={styles.monthTitle}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </ThemedText>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <ThemedText style={styles.legendText}>Taken</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <ThemedText style={styles.legendText}>Missed</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.textSecondary + '40' }]} />
          <ThemedText style={styles.legendText}>Upcoming</ThemedText>
        </View>
      </View>

      <ThemedView style={[styles.calendar, Shadow.card]}>
        <View style={styles.weekDays}>
          {daysOfWeek.map((day) => (
            <View key={day} style={styles.weekDayCell}>
              <ThemedText style={[styles.weekDayText, { color: colors.textSecondary }]}>
                {day}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {days.map((item, index) => (
            <View key={index} style={styles.dayCell}>
              {item.day && (
                <View
                  style={[
                    styles.dayCircle,
                    item.status === 'taken' && { backgroundColor: colors.success },
                    item.status === 'missed' && { backgroundColor: colors.error },
                    item.status === 'upcoming' && { backgroundColor: colors.textSecondary + '20' },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.dayText,
                      (item.status === 'taken' || item.status === 'missed') && { color: '#FFFFFF' },
                    ]}
                  >
                    {item.day}
                  </ThemedText>
                </View>
              )}
            </View>
          ))}
        </View>
      </ThemedView>

      <View style={styles.stats}>
        <ThemedText style={styles.statsTitle}>This Month</ThemedText>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: colors.success }]}>24</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Taken</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: colors.error }]}>2</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Missed</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: colors.primary }]}>92%</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Adherence</ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  monthTitle: {
    ...Typography.title1,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    ...Typography.footnote,
  },
  calendar: {
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    ...Typography.footnote,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  dayCircle: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    ...Typography.callout,
    fontSize: 14,
  },
  stats: {
    paddingHorizontal: Spacing.xl,
  },
  statsTitle: {
    ...Typography.title2,
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.title1,
  },
  statLabel: {
    ...Typography.footnote,
  },
});
