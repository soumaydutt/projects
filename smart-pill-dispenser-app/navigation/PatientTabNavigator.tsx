import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius } from '@/constants/theme';

import PatientHomeScreen from '@/screens/patient/PatientHomeScreen';
import CalendarScreen from '@/screens/patient/CalendarScreen';
import HistoryScreen from '@/screens/patient/HistoryScreen';
import ChatScreen from '@/screens/patient/ChatScreen';
import PatientProfileScreen from '@/screens/patient/PatientProfileScreen';

const Tab = createBottomTabNavigator();

export default function PatientTabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 88,
          paddingBottom: 34,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={PatientHomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="clock" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-square" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={PatientProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
