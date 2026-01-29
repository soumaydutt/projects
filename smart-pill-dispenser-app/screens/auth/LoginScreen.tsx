import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useState } from 'react';
import { useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login, credentials } = useAuth();
  const route = useRoute();
  const role = (route.params as any)?.role || 'patient';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) return;
    
    setLoading(true);
    try {
      setError(null);
      await login(email, password, role);
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid email or password. Use the credentials shown below.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenKeyboardAwareScrollView style={{ backgroundColor: colors.backgroundDefault }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Feather 
              name={role === 'patient' ? 'user' : 'heart'} 
              size={40} 
              color={colors.primary} 
            />
          </View>
          <ThemedText style={styles.title}>
            {role === 'patient' ? 'Patient Login' : 'Caregiver Login'}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to access your account
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.backgroundTertiary,
                },
              ]}
              placeholder="Enter your email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.backgroundTertiary,
                },
              ]}
              placeholder="Enter your password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <PrimaryButton
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            disabled={!email || !password}
            style={styles.loginButton}
          />

          {error ? (
            <ThemedText style={[styles.error, { color: colors.error }]}>
              {error}
            </ThemedText>
          ) : (
            <ThemedText style={[styles.hint, { color: colors.textSecondary }]}>
              Demo credentials: {credentials.email} / {credentials.password}
            </ThemedText>
          )}
        </View>
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.title1,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    ...Typography.headline,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    ...Typography.body,
  },
  loginButton: {
    marginTop: Spacing.lg,
  },
  hint: {
    ...Typography.footnote,
    textAlign: 'center',
  },
  error: {
    ...Typography.footnote,
    textAlign: 'center',
  },
});
