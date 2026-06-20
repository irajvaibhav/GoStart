// DailyResetScreen.js — empty state shown whenever FindMatchScreen has
// nothing to show. three different reasons land here (see `reason` param),
// and they're NOT the same problem - out of credits/daily limit can be
// fixed by buying credits, but "no profiles left" can't, there's just
// nobody new to show yet, so the copy and the button both need to match
// the actual reason instead of always pointing at buying credits.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../theme';

const REASONS = {
  credits: {
    emoji: '💫',
    title: "You're Out of Credits",
    subtitle: 'Buy more credits to keep finding matches.',
    showTimer: false,
    buttonText: 'Buy Credits',
    buttonTarget: 'BuyCredits',
  },
  dailyLimit: {
    emoji: '⏳',
    title: 'Daily Limit Reached',
    subtitle: "You've used today's free swipes.\nThey reset at midnight, or buy more credits now.",
    showTimer: true,
    buttonText: 'Buy Credits',
    buttonTarget: 'BuyCredits',
  },
  noProfiles: {
    emoji: '🔍',
    title: "That's Everyone For Now!",
    subtitle: "You've seen all the profiles that match your filters.\nCheck back later, or widen your filters.",
    showTimer: false,
    buttonText: 'Adjust Filters',
    buttonTarget: 'Filters',
  },
};

export default function DailyResetScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const reason = REASONS[route.params?.reason] || REASONS.credits;

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
        <Text style={styles.emoji}>{reason.emoji}</Text>

        <Text style={styles.title}>{reason.title}</Text>

        <Text style={styles.subtitle}>{reason.subtitle}</Text>

        {/* countdown only makes sense for the daily-limit case - buying
            credits or adjusting filters don't have a "resets in" clock */}
        {reason.showTimer && (
          <View style={styles.timerBox}>
            <Text style={styles.timerLabel}>Resets in</Text>
            <Text style={styles.timerValue}>~24 hours</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.buyBtn}
          onPress={() => navigation.navigate(reason.buttonTarget)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={theme.colors.golden}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buyGradient}
          >
            <Text style={styles.buyText}>{reason.buttonText}</Text>
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
