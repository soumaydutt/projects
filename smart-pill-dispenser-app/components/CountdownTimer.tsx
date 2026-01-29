import { View, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography } from '@/constants/theme';
import { useEffect, useState } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';

interface CountdownTimerProps {
  targetTime: Date;
}

export function CountdownTimer({ targetTime }: CountdownTimerProps) {
  const { colors } = useTheme();
  const [timeLeft, setTimeLeft] = useState('');
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetTime).getTime();
      const difference = target - now;

      if (difference > 0) {
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        
        scale.value = withSequence(
          withSpring(1.05, { duration: 100 }),
          withSpring(1, { duration: 100 })
        );
      } else {
        setTimeLeft('00:00:00');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
        Next Dose In
      </ThemedText>
      <Animated.View style={animatedStyle}>
        <ThemedText style={styles.time}>{timeLeft}</ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  label: {
    ...Typography.callout,
    marginBottom: Spacing.sm,
  },
  time: {
    ...Typography.title1,
    fontSize: 48,
    fontWeight: '700',
  },
});
