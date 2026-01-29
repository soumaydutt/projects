import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography, Shadow } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: keyof typeof Feather.glyphMap;
  iconColor?: string;
  style?: ViewStyle;
}

export function StatCard({ title, value, subtitle, icon, iconColor, style }: StatCardProps) {
  const { colors } = useTheme();

  return (
    <ThemedView style={[styles.card, Shadow.card, style]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {icon && (
          <Feather 
            name={icon} 
            size={20} 
            color={iconColor || colors.primary} 
          />
        )}
      </View>
      <ThemedText style={styles.value}>{value}</ThemedText>
      {subtitle && (
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.callout,
  },
  value: {
    ...Typography.title1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.footnote,
  },
});
