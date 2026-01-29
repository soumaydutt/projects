import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { Colors } from '@/constants/theme';

type ThemeName = 'light' | 'dark';

interface ThemeContextType {
  themeName: ThemeName;
  colors: typeof Colors.light;
  isDark: boolean;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'theme-preference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  const [themeName, setThemeName] = useState<ThemeName>(system);
  const isDark = themeName === 'dark';

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') {
          setThemeName(stored);
        }
      } catch (error) {
        console.warn('Unable to load theme preference', error);
      }
    };
    loadPreference();
  }, []);

  const setTheme = async (theme: ThemeName) => {
    setThemeName(theme);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      console.warn('Unable to save theme preference', error);
    }
  };

  const value = useMemo(
    () => ({
      themeName,
      colors: Colors[themeName],
      isDark,
      setTheme,
      toggleTheme: () => setTheme(themeName === 'dark' ? 'light' : 'dark'),
    }),
    [themeName, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return ctx;
}
