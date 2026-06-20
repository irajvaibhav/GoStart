// App.js — entry point
// loads custom fonts, shows splash while loading, wraps everything in AuthProvider

// must be the first import: RN's built-in URL has no setter for `.protocol`,
// which expo-asset relies on at module load time — this polyfill fixes that.
import 'react-native-url-polyfill/auto';

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { useFonts, DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold } from '@expo-google-fonts/outfit';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider } from './src/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import theme from './src/theme';

export default function App() {
  // load all fonts upfront so we don't get flashes of unstyled text
  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
  });

  // splash screen while fonts load
  if (!fontsLoaded) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    // GestureHandlerRootView has to wrap the whole app (not just the screen
    // that uses it) or react-native-gesture-handler's gestures - like the
    // swipe on FindMatchScreen - silently don't work on Android
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// package.json's "main" points straight at this file (no AppEntry.js wrapper),
// so we have to register the root component ourselves.
registerRootComponent(App);

