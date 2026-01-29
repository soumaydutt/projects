import { View, StyleSheet, Pressable, Switch, Alert, Platform, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';

export default function PatientProfileScreen() {
  const { colors, isDark, setTheme } = useTheme();
  const { user, logout, credentials, updateCredentials, biometricEnabled, setBiometricEnabled } = useAuth();
  const [darkMode, setDarkMode] = useState(isDark);
  const [name, setName] = useState(credentials.name);
  const [email, setEmail] = useState(credentials.email);
  const [password, setPassword] = useState(credentials.password);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setDarkMode(isDark);
  }, [isDark]);

  useEffect(() => {
    setName(credentials.name);
    setEmail(credentials.email);
    setPassword(credentials.password);
  }, [credentials]);

  const displayName = user?.name || credentials.name;
  const displayEmail = user?.email || credentials.email;

  const handleSaveCredentials = async () => {
    if (!email || !password || !name) {
      setSaveMessage('Please fill name, email, and password.');
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    try {
      await updateCredentials(email, password, name);
      setSaveMessage('Account updated. Use the new email/password to sign in.');
    } catch (error) {
      setSaveMessage('Could not update credentials. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        logout();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: logout },
        ]
      );
    }
  };

  return (
    <ScreenScrollView style={{ backgroundColor: colors.backgroundDefault }}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
          <Feather name="user" size={48} color={colors.primary} />
        </View>
        <ThemedText style={styles.name}>{displayName}</ThemedText>
        <ThemedText style={[styles.email, { color: colors.textSecondary }]}>
          {displayEmail}
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Preferences</ThemedText>

        <ThemedView style={[styles.settingCard, Shadow.card]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather name="moon" size={20} color={colors.text} />
              <ThemedText style={styles.settingLabel}>Dark Mode</ThemedText>
            </View>
            <Switch
              value={darkMode}
              onValueChange={(value) => {
                setDarkMode(value);
                setTheme(value ? 'dark' : 'light');
              }}
              trackColor={{ false: colors.textSecondary, true: colors.primary }}
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowBorder, { borderTopColor: colors.backgroundTertiary }]}>
            <View style={styles.settingInfo}>
              <Feather name="lock" size={20} color={colors.text} />
              <ThemedText style={styles.settingLabel}>Biometric Login</ThemedText>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: colors.textSecondary, true: colors.primary }}
            />
          </View>
        </ThemedView>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Account</ThemedText>
        <ThemedView style={[styles.settingCard, Shadow.card]}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Name</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.backgroundTertiary }]}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.backgroundTertiary }]}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.backgroundTertiary }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />
          </View>
          <PrimaryButton
            title={saving ? 'Saving...' : 'Save Credentials'}
            onPress={handleSaveCredentials}
            disabled={saving}
            style={{ marginTop: Spacing.md }}
          />
          {saveMessage && (
            <ThemedText style={[styles.saveMessage, { color: colors.textSecondary }]}>
              {saveMessage}
            </ThemedText>
          )}
        </ThemedView>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Health Data</ThemedText>

        <Pressable>
          <ThemedView style={[styles.menuCard, Shadow.card]}>
            <View style={styles.menuRow}>
              <View style={styles.menuInfo}>
                <Feather name="download" size={20} color={colors.text} />
                <ThemedText style={styles.menuLabel}>Backup Data</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </View>
          </ThemedView>
        </Pressable>

        <Pressable>
          <ThemedView style={[styles.menuCard, Shadow.card]}>
            <View style={styles.menuRow}>
              <View style={styles.menuInfo}>
                <Feather name="smartphone" size={20} color={colors.text} />
                <ThemedText style={styles.menuLabel}>Manage Devices</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </View>
          </ThemedView>
        </Pressable>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Support</ThemedText>

        <Pressable>
          <ThemedView style={[styles.menuCard, Shadow.card]}>
            <View style={styles.menuRow}>
              <View style={styles.menuInfo}>
                <Feather name="help-circle" size={20} color={colors.text} />
                <ThemedText style={styles.menuLabel}>Help Center</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </View>
          </ThemedView>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          title="Logout"
          onPress={handleLogout}
          variant="outline"
        />
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  name: {
    ...Typography.title1,
    marginBottom: Spacing.xs,
  },
  email: {
    ...Typography.body,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.headline,
    marginBottom: Spacing.md,
  },
  settingCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  settingRowBorder: {
    borderTopWidth: 1,
    marginTop: Spacing.md,
    paddingTop: Spacing.lg,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingLabel: {
    ...Typography.body,
  },
  menuCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuLabel: {
    ...Typography.body,
  },
  inputGroup: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
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
  saveMessage: {
    ...Typography.footnote,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  actions: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
});
