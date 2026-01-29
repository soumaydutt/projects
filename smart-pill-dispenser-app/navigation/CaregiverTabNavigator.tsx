import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

import CaregiverDashboardScreen from '@/screens/caregiver/CaregiverDashboardScreen';
import PatientsScreen from '@/screens/caregiver/PatientsScreen';
import AlertsScreen from '@/screens/caregiver/AlertsScreen';
import MessagesScreen from '@/screens/caregiver/MessagesScreen';
import CaregiverProfileScreen from '@/screens/caregiver/CaregiverProfileScreen';

const Tab = createBottomTabNavigator();

export default function CaregiverTabNavigator() {
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
        name="Dashboard"
        component={CaregiverDashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Patients"
        component={PatientsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="bell" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={CaregiverProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
