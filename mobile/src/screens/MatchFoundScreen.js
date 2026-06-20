// MatchFoundScreen.js — shows matched profile card
// golden sparkle header, big photo, profile details, interest chips
// receives profile via route params from FindMatchScreen

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import theme from '../theme';
import { resolvePhotoUrl } from '../api';

const { width } = Dimensions.get('window');

export default function MatchFoundScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const profile = route.params?.profile || {};
  // match only exists when FindMatchScreen's like() call came back mutual -
  // a one-sided like has no Match document, so there's no chat to start yet
  const match = route.params?.match || null;

  // fallback values so screen doesn't crash if backend sends partial data
  const {
    name = 'Unknown',
    age = '?',
    city = 'Somewhere',
    height = '',
    religion = '',
    distance = '',
    profession = '',
    college = '',
    bio = '',
    interests = [],
    isVerified = false,
    photos = [],
    weekendVibe = '',
    firstDateIdea = '',
    loveLanguage = '',
  } = profile;

  // grab first photo from the array
  const photo = resolvePhotoUrl(photos.length > 0 ? photos[0] : null);

  // location line like "Gurgaon · 5'4 · Hindu"
  const infoLine = [city, height, religion].filter(Boolean).join(' · ');
  // distance line like "3 km away · Student/LSR"
  const profLine = [profession, college].filter(Boolean).join('/');
  const distanceLine = [distance ? `${distance} km away` : '', profLine].filter(Boolean).join(' · ');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* back button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* golden sparkle header */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.sparkleHeader}>
          <LinearGradient
            colors={theme.colors.golden}
            style={styles.sparkleCircle}
          >
            <Text style={styles.sparkleIcon}>✦</Text>
          </LinearGradient>
          {/* only a real mutual match unlocks chat - a one-sided like just
              gets a friendlier heads-up that we'll let them know if it becomes one */}
          <Text style={styles.matchLabel}>{match ? "It's a Match!" : 'Liked!'}</Text>
        </Animated.View>

        {/* profile card */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
          {/* profile photo */}
          <View style={styles.photoWrap}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photo} />
            ) : (
              // placeholder gradient when no photo
              <LinearGradient
                colors={['#2A2A2A', '#1A1A1A']}
                style={styles.photo}
              >
                <Text style={styles.photoPlaceholder}>
                  {name.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            )}
          </View>

          {/* name + age */}
          <Text style={styles.nameText}>{name}, {age}</Text>

          {/* city, height, religion */}
          {infoLine ? <Text style={styles.infoLine}>{infoLine}</Text> : null}

          {/* verified badge */}
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✓</Text>
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}

          {/* distance + profession */}
          {distanceLine ? <Text style={styles.distanceLine}>{distanceLine}</Text> : null}

          {/* about section */}
          {bio ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ABOUT</Text>
              <Text style={styles.bioText}>{bio}</Text>
            </View>
          ) : null}

          {/* interest chips */}
          {interests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>INTERESTS</Text>
              <View style={styles.chipRow}>
                {interests.map((tag, i) => (
                  <View key={i} style={styles.chip}>
                    <Text style={styles.chipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* details grid — weekend vibe, first date, love language */}
          {(weekendVibe || firstDateIdea || loveLanguage) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DETAILS</Text>
              <View style={styles.detailsGrid}>
                {weekendVibe ? (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Weekend vibe</Text>
                    <Text style={styles.detailValue}>{weekendVibe}</Text>
                  </View>
                ) : null}
                {firstDateIdea ? (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>First date idea</Text>
                    <Text style={styles.detailValue}>{firstDateIdea}</Text>
                  </View>
                ) : null}
                {loveLanguage ? (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Love language</Text>
                    <Text style={styles.detailValue}>{loveLanguage}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}
        </Animated.View>

        {/* start conversation button - only shown when there's an actual
            Match doc to chat against. without `match`, chat.js has nothing
            to look up and would just 404. */}
        <Animated.View entering={FadeInDown.delay(400)}>
          {match ? (
            <TouchableOpacity
              style={styles.startBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('StartConversation', { profile, match })}
            >
              <Text style={styles.startBtnText}>Start Conversation</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.startBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('FindMatchHome')}
            >
              <Text style={styles.startBtnText}>Keep Swiping</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scroll: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  backBtn: {
    marginBottom: theme.spacing.md,
  },
  backText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  sparkleHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sparkleCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sparkleIcon: {
    fontSize: 24,
    color: '#fff',
  },
  matchLabel: {
    fontFamily: theme.fonts.heading,
    fontSize: 28,
    color: theme.colors.accent,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  photoWrap: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  photo: {
    width: width - 80,
    height: 300,
    borderRadius: theme.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholder: {
    fontSize: 72,
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.heading,
  },
  nameText: {
    fontFamily: theme.fonts.heading,
    fontSize: 26,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  infoLine: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  verifiedIcon: {
    color: theme.colors.success,
    fontSize: 14,
    fontWeight: 'bold',
  },
  verifiedText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 12,
    color: theme.colors.success,
  },
  distanceLine: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 11,
    color: theme.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.sm,
  },
  bioText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(232,197,71,0.1)', // golden tint bg
    borderWidth: 1,
    borderColor: 'rgba(232,197,71,0.3)',
    borderRadius: theme.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.accent,
  },
  detailsGrid: {
    gap: theme.spacing.md,
  },
  detailItem: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
  },
  detailLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  detailValue: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  startBtn: {
    backgroundColor: theme.colors.crimson,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  startBtnText: {
    color: '#fff',
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 16,
  },
});
