import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/theme';

// Screens
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { MemoriesScreen } from '../screens/MemoriesScreen';
import { RecordScreen } from '../screens/RecordScreen';
import { ComposeScreen } from '../screens/ComposeScreen';
import { FamilyScreen } from '../screens/FamilyScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, focused }: { icon: string; focused: boolean }) => (
  <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
    <Text style={styles.tabIconText}>{icon}</Text>
  </View>
);

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.paperMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Memories"
        component={MemoriesScreen}
        options={{
          tabBarLabel: 'Memories',
          tabBarIcon: ({ focused }) => <TabIcon icon="📸" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Record"
        component={RecordScreen}
        options={{
          tabBarLabel: 'Record',
          tabBarIcon: ({ focused }) => <TabIcon icon="🎙" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Compose"
        component={ComposeScreen}
        options={{
          tabBarLabel: 'Write',
          tabBarIcon: ({ focused }) => <TabIcon icon="✉️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Family"
        component={FamilyScreen}
        options={{
          tabBarLabel: 'Family',
          tabBarIcon: ({ focused }) => <TabIcon icon="👨‍👩‍👧" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.void },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
};

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <Text style={styles.loadingLogo}>Heirloom</Text>
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.voidElevated,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 8,
    height: 70,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
  tabIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconFocused: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  tabIconText: {
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.void,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    fontSize: 36,
    fontWeight: '300',
    color: colors.gold,
    letterSpacing: 4,
    fontFamily: 'Georgia',
  },
  loadingText: {
    fontSize: 14,
    color: colors.paperDim,
    marginTop: 16,
  },
});
