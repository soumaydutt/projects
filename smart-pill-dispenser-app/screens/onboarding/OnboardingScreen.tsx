import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useState, useRef } from 'react';
import Animated, { useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: 1,
    title: 'Welcome to PillCare',
    subtitle: 'Your smart medication companion for better health',
    icon: 'heart' as const,
  },
  {
    id: 2,
    title: 'Never Miss a Dose',
    subtitle: 'Timely reminders and smart dispensing keep you on track',
    icon: 'clock' as const,
  },
  {
    id: 3,
    title: 'Stay Connected',
    subtitle: 'Caregivers can monitor and support your medication journey',
    icon: 'users' as const,
  },
  {
    id: 4,
    title: 'Track Your Progress',
    subtitle: 'AI insights and gamification make adherence rewarding',
    icon: 'trending-up' as const,
  },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { completeOnboarding } = useAuth();
  const scrollX = useSharedValue(0);
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundDefault }]}>
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            <View style={styles.content}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Feather name={slide.icon} size={80} color={colors.primary} />
              </View>
              <ThemedText style={styles.title}>{slide.title}</ThemedText>
              <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                {slide.subtitle}
              </ThemedText>
            </View>
          </View>
        ))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => {
            const dotStyle = useAnimatedStyle(() => {
              const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
              const scale = interpolate(scrollX.value, inputRange, [0.8, 1.2, 0.8]);
              const opacity = interpolate(scrollX.value, inputRange, [0.4, 1, 0.4]);

              return {
                transform: [{ scale }],
                opacity,
              };
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: colors.primary },
                  dotStyle,
                ]}
              />
            );
          })}
        </View>

        <View style={styles.buttons}>
          {currentIndex < slides.length - 1 ? (
            <>
              <Pressable onPress={handleSkip}>
                <ThemedText style={[styles.skipText, { color: colors.textSecondary }]}>
                  Skip
                </ThemedText>
              </Pressable>
              <PrimaryButton title="Next" onPress={handleNext} style={styles.nextButton} />
            </>
          ) : (
            <PrimaryButton title="Get Started" onPress={handleNext} style={styles.fullButton} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['4xl'],
  },
  title: {
    ...Typography.largeTitle,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  skipText: {
    ...Typography.headline,
  },
  nextButton: {
    flex: 1,
  },
  fullButton: {
    width: '100%',
  },
});
