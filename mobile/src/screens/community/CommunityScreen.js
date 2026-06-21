// CommunityScreen.js — placeholder for community feature
// just a coming soon page with some interest tags for now

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../../theme';

// some sample interests to make the page less empty
const INTERESTS = [
  '☕ Chai Lover', '🌅 Early Bird', '📚 Bookworm', '✈️ Traveller',
  '🎵 Music', '🎮 Gaming', '🧘 Yoga', '📷 Photography',
  '🍳 Cooking', '🏃 Fitness', '🎨 Art', '🐶 Dog Person',
];

// deliberately static - no backend calls here at all. there's no
// community/group functionality in the backend (no routes, no model),
// this is just a placeholder tab so the bottom nav isn't missing a screen.
export default function CommunityScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>Community</Text>

      <View style={styles.content}>
        <Text style={styles.emoji}>🌟</Text>
        <Text style={styles.title}>Coming Soon!</Text>
        <Text style={styles.subtitle}>
          Connect with people who share your interests.{'\n'}
          Join communities, attend events, and more.
        </Text>

        {/* interest tags grid */}
        <View style={styles.tagsWrap}>
          {INTERESTS.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    fontFamily: theme.fonts.heading,
    fontSize: 28,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  emoji: {
    fontSize: 56,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.fonts.heading,
    fontSize: 26,
    color: theme.colors.accent,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: theme.spacing.md,
  },
  tag: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tagText: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
});
