import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Role = 'patient' | 'caregiver' | null;

export default function RoleSelectionScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  const handleRoleSelect = (role: 'patient' | 'caregiver') => {
    setSelectedRole(role);
    setTimeout(() => {
      navigation.navigate('Login' as never, { role } as never);
    }, 300);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundDefault }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Welcome to PillCare</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          Choose your role to continue
        </ThemedText>
      </View>

      <View style={styles.content}>
        <RoleCard
          title="I'm a Patient"
          description="Track medications, get reminders, and manage your health"
          icon="user"
          selected={selectedRole === 'patient'}
          onPress={() => handleRoleSelect('patient')}
        />

        <RoleCard
          title="I'm a Caregiver"
          description="Monitor patients, manage care, and stay connected"
          icon="heart"
          selected={selectedRole === 'caregiver'}
          onPress={() => handleRoleSelect('caregiver')}
        />
      </View>
    </View>
  );
}

interface RoleCardProps {
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  selected: boolean;
  onPress: () => void;
}

function RoleCard({ title, description, icon, selected, onPress }: RoleCardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle]}
    >
      <ThemedView
        style={[
          styles.roleCard,
          Shadow.card,
          selected && { borderColor: colors.primary, borderWidth: 2 },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <Feather name={icon} size={40} color={colors.primary} />
        </View>
        <ThemedText style={styles.roleTitle}>{title}</ThemedText>
        <ThemedText style={[styles.roleDescription, { color: colors.textSecondary }]}>
          {description}
        </ThemedText>
        <Feather 
          name="arrow-right" 
          size={24} 
          color={selected ? colors.primary : colors.textSecondary} 
          style={styles.arrow}
        />
      </ThemedView>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    paddingTop: 80,
    paddingBottom: Spacing['4xl'],
    alignItems: 'center',
  },
  title: {
    ...Typography.largeTitle,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  content: {
    gap: Spacing.lg,
  },
  roleCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  roleTitle: {
    ...Typography.title2,
    marginBottom: Spacing.sm,
  },
  roleDescription: {
    ...Typography.callout,
    textAlign: 'center',
  },
  arrow: {
    position: 'absolute',
    right: Spacing.lg,
    top: '50%',
    marginTop: -12,
  },
});
