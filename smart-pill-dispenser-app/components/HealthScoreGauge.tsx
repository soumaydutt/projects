import { View, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography } from '@/constants/theme';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface HealthScoreGaugeProps {
  score: number;
  size?: number;
}

export function HealthScoreGauge({ score, size = 160 }: HealthScoreGaugeProps) {
  const { colors } = useTheme();
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score / 100, { duration: 1200 });
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const getScoreColor = () => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.backgroundTertiary}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getScoreColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
          animatedProps={animatedProps}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.scoreContainer}>
        <ThemedText style={styles.scoreValue}>{score}</ThemedText>
        <ThemedText style={[styles.scoreLabel, { color: colors.textSecondary }]}>
          Health Score
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreValue: {
    ...Typography.title1,
    fontSize: 48,
  },
  scoreLabel: {
    ...Typography.footnote,
  },
});
