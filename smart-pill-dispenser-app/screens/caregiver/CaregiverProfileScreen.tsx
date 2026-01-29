import { View, StyleSheet, Pressable, Switch, Alert, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';

export default function CaregiverProfileScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const colorScheme = useColorScheme();
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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
          <Feather name="heart" size={48} color={colors.primary} />
        </View>
        <ThemedText style={styles.name}>{user?.name}</ThemedText>
        <ThemedText style={[styles.email, { color: colors.textSecondary }]}>
          {user?.email}
        </ThemedText>
        <ThemedText style={[styles.role, { color: colors.primary }]}>
          Healthcare Professional
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
              onValueChange={setDarkMode}
              trackColor={{ false: colors.textSecondary, true: colors.primary }}
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowBorder, { borderTopColor: colors.backgroundTertiary }]}>
            <View style={styles.settingInfo}>
              <Feather name="bell" size={20} color={colors.text} />
              <ThemedText style={styles.settingLabel}>Push Notifications</ThemedText>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.textSecondary, true: colors.primary }}
            />
          </View>
        </ThemedView>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Account</ThemedText>

        <Pressable>
          <ThemedView style={[styles.menuCard, Shadow.card]}>
            <View style={styles.menuRow}>
              <View style={styles.menuInfo}>
                <Feather name="settings" size={20} color={colors.text} />
                <ThemedText style={styles.menuLabel}>Account Settings</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </View>
          </ThemedView>
        </Pressable>

        <Pressable>
          <ThemedView style={[styles.menuCard, Shadow.card]}>
            <View style={styles.menuRow}>
              <View style={styles.menuInfo}>
                <Feather name="help-circle" size={20} color={colors.text} />
                <ThemedText style={styles.menuLabel}>Help & Support</ThemedText>
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
    marginBottom: Spacing.xs,
  },
  role: {
    ...Typography.callout,
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
  actions: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
});
