import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function BiometricGate() {
  const { colors } = useTheme();
  const { setHasBiometricAuth, setBiometricEnabled } = useAuth();
  const [status, setStatus] = useState<'checking' | 'error'>('checking');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    // On web/unsupported, skip biometric to avoid blocking.
    if (Platform.OS === 'web') {
      setBiometricEnabled(false);
      setHasBiometricAuth(true);
      return;
    }
    authenticate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const authenticate = async () => {
    setStatus('checking');
    setMessage('');

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        setMessage('Biometric hardware is not available on this device. Biometrics disabled.');
        setBiometricEnabled(false);
        setHasBiometricAuth(true);
        return;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        setMessage('No face/fingerprint is enrolled. Biometrics disabled; please enroll in system settings to re-enable.');
        setBiometricEnabled(false);
        setHasBiometricAuth(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock PillCare',
        fallbackLabel: 'Use device passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setHasBiometricAuth(true);
        return;
      }

      setMessage('Authentication failed. Try again.');
      setStatus('error');
    } catch (error) {
      console.error('Biometric auth error', error);
      setMessage('Could not start biometric authentication.');
      setStatus('error');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundDefault }]}>
      <ThemedView style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + '20' }]}>
          <Feather name="unlock" size={32} color={colors.primary} />
        </View>
        <ThemedText style={styles.title}>Biometric unlock required</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          Use Face ID / Touch ID / fingerprint to open PillCare.
        </ThemedText>

        {status === 'checking' ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: Spacing.lg }} />
        ) : null}

        {message ? (
          <ThemedText style={[styles.message, { color: colors.error }]}>{message}</ThemedText>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={authenticate}
            disabled={status === 'checking'}
          >
            <ThemedText style={styles.buttonText}>Try again</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.button, styles.secondaryButton, { borderColor: colors.backgroundTertiary }]}
            onPress={() => {
              setBiometricEnabled(false);
              setHasBiometricAuth(true);
            }}
            disabled={status === 'checking'}
          >
            <ThemedText style={[styles.secondaryText, { color: colors.textSecondary }]}>
              Disable biometrics
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    padding: Spacing['3xl'],
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.title2,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  message: {
    ...Typography.callout,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  button: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    ...Typography.headline,
    color: '#FFFFFF',
  },
  secondaryButton: {
    borderWidth: 1,
  },
  secondaryText: {
    ...Typography.headline,
  },
});
