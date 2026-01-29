import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';

import OnboardingScreen from '@/screens/onboarding/OnboardingScreen';
import RoleSelectionScreen from '@/screens/auth/RoleSelectionScreen';
import LoginScreen from '@/screens/auth/LoginScreen';
import BiometricGate from '@/screens/auth/BiometricGate';
import PatientTabNavigator from './PatientTabNavigator';
import CaregiverTabNavigator from './CaregiverTabNavigator';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, isLoading, hasSeenOnboarding, biometricEnabled, hasBiometricAuth } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundDefault }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!hasSeenOnboarding) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    );
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  if (biometricEnabled && !hasBiometricAuth) {
    return <BiometricGate />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user.role === 'patient' ? (
        <Stack.Screen name="PatientTabs" component={PatientTabNavigator} />
      ) : (
        <Stack.Screen name="CaregiverTabs" component={CaregiverTabNavigator} />
      )}
    </Stack.Navigator>
  );
}
