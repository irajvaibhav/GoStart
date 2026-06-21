// AppNavigator.js — all navigation in one file
// auth stack for logged out, tab navigator for logged in
// each tab has its own stack for nested screens

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../AuthContext';
import theme from '../theme';

// ─── screens ─────────────────────────────────────
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import FindMatchScreen from '../screens/match/FindMatchScreen';
import MatchFoundScreen from '../screens/match/MatchFoundScreen';
import StartConversationScreen from '../screens/match/StartConversationScreen';
import DailyResetScreen from '../screens/match/DailyResetScreen';
import FiltersScreen from '../screens/match/FiltersScreen';
import BuyCreditsScreen from '../screens/credits/BuyCreditsScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import CommunityScreen from '../screens/community/CommunityScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import VerificationScreen from '../screens/profile/VerificationScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// shared stack options — no header, dark bg
const stackScreenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: theme.colors.bg },
  animation: 'slide_from_right',
};

// ─── tab icon component ─────────────────────────
// simple unicode icons to avoid extra icon library dependency
function TabIcon({ label, focused }) {
  const icons = {
    'Find Match': '♥',
    'Messages': '💬',
    'Community': '👥',
    'Profile': '👤',
  };

  return (
    <View style={styles.tabIconWrap}>
      <Text style={[
        styles.tabIcon,
        { color: focused ? theme.colors.crimson : theme.colors.textMuted },
      ]}>
        {icons[label]}
      </Text>
    </View>
  );
}

// ─── stacks inside tabs ─────────────────────────

function FindMatchStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="FindMatchHome" component={FindMatchScreen} />
      <Stack.Screen name="MatchFound" component={MatchFoundScreen} />
      <Stack.Screen name="StartConversation" component={StartConversationScreen}
        options={{ presentation: 'transparentModal', animation: 'fade' }} />
      <Stack.Screen name="DailyReset" component={DailyResetScreen} />
      <Stack.Screen name="Filters" component={FiltersScreen}
        options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="BuyCredits" component={BuyCreditsScreen}
        options={{ animation: 'slide_from_bottom' }} />
    </Stack.Navigator>
  );
}

function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Verification" component={VerificationScreen} />
    </Stack.Navigator>
  );
}

// ─── main tab navigator ─────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false, // we render our own labels in TabIcon
      }}
    >
      <Tab.Screen
        name="Find Match"
        component={FindMatchStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Find Match" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Messages" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Community" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── auth stack (login / signup) ─────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

// ─── root navigator ─────────────────────────────
export default function AppNavigator() {
  const { isLoggedIn, loading } = useAuth();

  // AuthContext is still checking AsyncStorage for a saved token on launch.
  // without this guard, `isLoggedIn` reads false for that brief moment
  // (token starts as null) and an already-logged-in user would see a flash
  // of the login screen before bouncing to the main app.
  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isLoggedIn ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    backgroundColor: '#0A0A0A',
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    height: 70,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
  },
});
