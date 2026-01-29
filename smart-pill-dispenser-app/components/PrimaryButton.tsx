import { Pressable, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
}

export function PrimaryButton({ 
  title, 
  onPress, 
  disabled = false, 
  loading = false,
  variant = 'primary',
  style 
}: PrimaryButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const backgroundColor = variant === 'primary' 
    ? colors.primary 
    : variant === 'secondary' 
    ? colors.secondary 
    : 'transparent';

  const textColor = variant === 'outline' ? colors.primary : colors.buttonText;
  const borderColor = variant === 'outline' ? colors.primary : 'transparent';

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor, borderColor, borderWidth: variant === 'outline' ? 2 : 0 },
        (disabled || loading) && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <ThemedText style={[styles.text, { color: textColor }]}>
          {title}
        </ThemedText>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  text: {
    ...Typography.headline,
  },
  disabled: {
    opacity: 0.5,
  },
});
