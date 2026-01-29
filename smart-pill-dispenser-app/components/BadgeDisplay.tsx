import { View, StyleSheet, Image, ViewStyle } from 'react-native';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';

interface BadgeDisplayProps {
  title: string;
  image: any;
  unlocked?: boolean;
  size?: number;
  style?: ViewStyle;
}

export function BadgeDisplay({ title, image, unlocked = true, size = 80, style }: BadgeDisplayProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.imageContainer, { width: size, height: size }]}>
        <Image 
          source={image} 
          style={[
            styles.image, 
            { width: size, height: size },
            !unlocked && styles.locked
          ]} 
        />
      </View>
      <ThemedText style={[styles.title, !unlocked && { color: colors.textSecondary }]}>
        {title}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  imageContainer: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  locked: {
    opacity: 0.3,
  },
  title: {
    ...Typography.footnote,
    textAlign: 'center',
  },
});
