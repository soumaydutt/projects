import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

type UserRole = 'patient' | 'caregiver';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface Credentials {
  email: string;
  password: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  hasSeenOnboarding: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  credentials: Credentials;
  updateCredentials: (email: string, password: string, name?: string) => Promise<void>;
  biometricEnabled: boolean;
  setBiometricEnabled: (value: boolean) => Promise<void>;
  hasBiometricAuth: boolean;
  setHasBiometricAuth: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_CREDENTIALS: Credentials = {
  email: 'soumay@pillcare.com',
  password: 'pill123',
  name: 'Soumay',
};

const CREDENTIALS_KEY = 'userCredentials';
const BIOMETRIC_KEY = 'biometricEnabled';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [credentials, setCredentials] = useState<Credentials>(DEFAULT_CREDENTIALS);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [hasBiometricAuth, setHasBiometricAuth] = useState(false);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const onboardingStatus = await AsyncStorage.getItem('hasSeenOnboarding');
      setHasSeenOnboarding(onboardingStatus === 'true');

      // Load saved credentials or fall back to defaults.
      const savedCredentials = await AsyncStorage.getItem(CREDENTIALS_KEY);
      if (savedCredentials) {
        setCredentials(JSON.parse(savedCredentials));
      } else {
        setCredentials(DEFAULT_CREDENTIALS);
      }

      const savedBiometric = await AsyncStorage.getItem(BIOMETRIC_KEY);
      setBiometricEnabledState(savedBiometric === 'true');

      let token: string | null = null;
      let userDataString: string | null = null;

      if (Platform.OS === 'web') {
        token = await AsyncStorage.getItem('authToken');
        userDataString = await AsyncStorage.getItem('userData');
      } else {
        token = await SecureStore.getItemAsync('authToken');
        userDataString = await SecureStore.getItemAsync('userData');
      }

      if (token && userDataString) {
        const userData = JSON.parse(userDataString);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, role: UserRole) => {
    const current = credentials || DEFAULT_CREDENTIALS;
    const normalizedEmail = email.trim().toLowerCase();

    const VALID_EMAIL = current.email.toLowerCase();
    const VALID_PASSWORD = current.password;

    await new Promise(resolve => setTimeout(resolve, 300));

    if (email.trim().toLowerCase() !== VALID_EMAIL || password !== VALID_PASSWORD) {
      throw new Error('Invalid credentials');
    }

    const mockUser: User = {
      id: '1',
      name: current.name || 'Soumay',
      email: current.email,
      role,
    };

    if (Platform.OS === 'web') {
      await AsyncStorage.setItem('authToken', 'mock_token_12345');
      await AsyncStorage.setItem('userData', JSON.stringify(mockUser));
    } else {
      await SecureStore.setItemAsync('authToken', 'mock_token_12345');
      await SecureStore.setItemAsync('userData', JSON.stringify(mockUser));
    }

    setUser(mockUser);
  };

  const logout = async () => {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
    } else {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userData');
    }
    setUser(null);
    setHasBiometricAuth(false);
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    setHasSeenOnboarding(true);
  };

  const updateCredentials = async (email: string, password: string, name?: string) => {
    const next: Credentials = {
      email: email.trim(),
      password,
      name: name?.trim() || credentials.name || DEFAULT_CREDENTIALS.name,
    };

    try {
      await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(next));
      setCredentials(next);

      const updatedUser: User =
        user
          ? { ...user, name: next.name, email: next.email }
          : {
              id: '1',
              name: next.name,
              email: next.email,
              role: 'patient',
            };

      setUser(updatedUser);

      if (Platform.OS === 'web') {
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      } else {
        await SecureStore.setItemAsync('userData', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error updating credentials:', error);
      throw error;
    }
  };

  const setBiometricEnabled = async (value: boolean) => {
    setBiometricEnabledState(value);
    setHasBiometricAuth(false);
    try {
      await AsyncStorage.setItem(BIOMETRIC_KEY, value ? 'true' : 'false');
    } catch (error) {
      console.warn('Unable to save biometric setting', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        hasSeenOnboarding,
        login,
        logout,
        completeOnboarding,
        credentials,
        updateCredentials,
        biometricEnabled,
        setBiometricEnabled,
        hasBiometricAuth,
        setHasBiometricAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
