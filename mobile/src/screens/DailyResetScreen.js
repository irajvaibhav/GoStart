// DailyResetScreen.js — shown when user runs out of credits
// friendly empty state with option to buy more

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../theme';

export default function DailyResetScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* back button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        {/* big emoji because why not */}
        <Text style={styles.emoji}>💫</Text>

        <Text style={styles.title}>Happily Searching!</Text>

        <Text style={styles.subtitle}>
          Your free weekly credits will reset soon.{'\n'}
          Come back tomorrow or get more credits now.
        </Text>

        {/* countdown placeholder */}
        <View style={styles.timerBox}>
          <Text style={styles.timerLabel}>Resets in</Text>
          <Text style={styles.timerValue}>~24 hours</Text>
        </View>

        {/* buy credits CTA */}
        <TouchableOpacity
          style={styles.buyBtn}
          onPress={() => navigation.navigate('BuyCredits')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={theme.colors.golden}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buyGradient}
          >
            <Text style={styles.buyText}>Find More Matches</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  backBtn: {
    padding: theme.spacing.lg,
  },
  backText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontFamily: theme.fonts.heading,
    fontSize: 30,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: theme.spacing.md,
  },
  timerBox: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  timerLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  timerValue: {
    fontFamily: theme.fonts.heading,
    fontSize: 22,
    color: theme.colors.accent,
    marginTop: 4,
  },
  buyBtn: {
    marginTop: theme.spacing.xl,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    width: '100%',
  },
  buyGradient: {
    padding: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.radius.md,
  },
  buyText: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 16,
    color: '#fff',
  },
});
