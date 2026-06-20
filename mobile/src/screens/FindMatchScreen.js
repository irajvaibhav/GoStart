// FindMatchScreen.js — the hero screen ⭐
// this is the main landing screen from figma
// big gradient bg, "Ready to find your match?" heading
// swipe button at bottom triggers discover API

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Dimensions, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withSequence, withTiming, runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import theme from '../theme';
import { getDiscover, getCredits, likeUser, passUser, resolvePhotoUrl } from '../api';
import { useAuth } from '../AuthContext';

const { width } = Dimensions.get('window');

export default function FindMatchScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(user?.credits ?? 5);
  // the one profile currently being shown, waiting on a like/pass decision -
  // null means "show the swipe button", set means "show like/dislike buttons"
  const [candidate, setCandidate] = useState(null);

  // animate the swipe button
  const buttonScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // fetch credits on focus (simple approach)
  React.useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const res = await getCredits();
      setCredits(res.data.credits ?? res.data.balance ?? 5);
    } catch {
      // keep default
    }
  };

  // main action — fetch someone to consider. this does NOT like or pass on
  // its own anymore - it just shows the profile and lets handleLike/handlePass
  // below make the actual decision when the user taps one of those buttons.
  const handleFindMatch = async () => {
    // pulse animation on button
    buttonScale.value = withSequence(
      withSpring(0.95),
      withSpring(1),
    );

    if (credits <= 0) {
      navigation.navigate('DailyReset', { reason: 'credits' });
      return;
    }

    setLoading(true);
    try {
      // get available profiles from backend
      const res = await getDiscover();
      const profiles = res.data.profiles || [];

      if (profiles.length === 0) {
        // distinct from running out of credits - buying credits wouldn't
        // help here, there's just nobody left to show right now
        navigation.navigate('DailyReset', { reason: 'noProfiles' });
        return;
      }

      setCandidate(profiles[0]);
    } catch (err) {
      if (err.response?.status === 429) {
        // daily swipe limit hit
        navigation.navigate('DailyReset', { reason: 'dailyLimit' });
      } else if (err.response?.status === 403) {
        // out of credits
        navigation.navigate('BuyCredits');
      } else {
        Alert.alert('Error', err.response?.data?.error || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  // user tapped the heart - actually like the candidate currently on screen
  const handleLike = async () => {
    if (!candidate) return;
    setLoading(true);
    try {
      const likeRes = await likeUser(candidate._id);
      setCredits(likeRes.data.creditsRemaining ?? credits - 1);
      const likedProfile = candidate;
      setCandidate(null);

      // pass the real Match document through too (only exists when matched:
      // true) - StartConversationScreen needs its real _id to open the chat.
      navigation.navigate('MatchFound', {
        profile: likedProfile,
        isMutualMatch: likeRes.data.matched,
        match: likeRes.data.match,
      });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // user tapped the X - pass on the candidate, free (no credit cost), then
  // just go back to the swipe button so they can fetch the next one
  const handlePass = async () => {
    if (!candidate) return;
    setLoading(true);
    try {
      await passUser(candidate._id);
    } catch {
      // not a big deal if this fails to save - worst case they might see
      // this profile again later, nothing destructive happened
    } finally {
      setCandidate(null);
      setLoading(false);
    }
  };

  // swipe gesture on the button — swipe right to trigger match
  // useSharedValue is reanimated's special state - unlike useState, updating
  // it doesn't trigger a React re-render. it's read directly by the native
  // rendering thread, which is why gesture-driven animations stay at 60fps
  // even while JS is busy (e.g. mid network request).
  const swipeX = useSharedValue(0);
  const swipeGesture = Gesture.Pan()
    .onUpdate((e) => {
      // only allow right swipe - e.translationX is how far the finger has
      // moved from where the gesture started, negative = moved left
      if (e.translationX > 0) {
        swipeX.value = Math.min(e.translationX, 150); // cap how far it can slide
      }
    })
    .onEnd((e) => {
      if (e.translationX > 100) {
        // swiped far enough — snap back to 0 and trigger find, same as
        // tapping the button. onEnd callbacks run as UI-thread "worklets" by
        // default (gesture-handler v2 + reanimated's babel plugin) - calling
        // handleFindMatch directly here crashed the app, because it does
        // React state updates / navigation / network calls, none of which
        // are safe from the UI thread. runOnJS hops back to the JS thread
        // first, which is what actually fixes it.
        swipeX.value = withSpring(0);
        runOnJS(handleFindMatch)();
      } else {
        // didn't swipe far enough - spring back to start, do nothing
        swipeX.value = withSpring(0);
      }
    });

  // useAnimatedStyle rebuilds this style object on the native thread
  // whenever swipeX changes, so the little arrow indicator visually tracks
  // the finger without React ever re-rendering the component
  const swipeIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: swipeX.value }],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* dark gradient background — placeholder for romantic hero image */}
      <LinearGradient
        colors={['#1A1A1A', '#0D0D0D', '#0D0D0D']}
        style={StyleSheet.absoluteFill}
      />

      {/* top bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Text style={styles.logoIcon}>♥</Text>
          <Text style={styles.logoText}>Gostart</Text>
        </View>

        {/* credits badge */}
        <TouchableOpacity
          style={styles.creditsBadge}
          onPress={() => navigation.navigate('BuyCredits')}
        >
          <Text style={styles.creditsText}>Credits Left</Text>
          <Text style={styles.creditsCount}>{credits}</Text>
        </TouchableOpacity>
      </View>

      {/* hero content - swapped out for a candidate preview once one's been fetched */}
      {candidate ? (
        <View style={styles.heroContent}>
          {candidate.photos?.[0] ? (
            <Image source={{ uri: resolvePhotoUrl(candidate.photos[0]) }} style={styles.candidatePhoto} />
          ) : (
            <View style={[styles.candidatePhoto, styles.candidatePhotoFallback]}>
              <Text style={styles.candidatePhotoText}>
                {(candidate.name || '?').charAt(0)}
              </Text>
            </View>
          )}
          <Text style={styles.candidateName}>{candidate.name}, {candidate.age}</Text>
          {candidate.city ? <Text style={styles.candidateCity}>{candidate.city}</Text> : null}
        </View>
      ) : (
        <View style={styles.heroContent}>
          {/* golden accent line */}
          <LinearGradient
            colors={theme.colors.golden}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accentLine}
          />

          <Text style={styles.heroTitle}>
            Ready to find{'\n'}your match?
          </Text>

          <View style={styles.subtitleRow}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.heroSubtitle}>
              Verified profiles. Serious intentions.{'\n'}Real relationships.
            </Text>
          </View>

          {/* filters button */}
          <TouchableOpacity
            style={styles.filtersBtn}
            onPress={() => navigation.navigate('Filters')}
          >
            <Text style={styles.filterIcon}>⚙</Text>
            <Text style={styles.filtersText}>Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* bottom action area */}
      <View style={styles.bottomArea}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
            <Text style={styles.loadingText}>
              {candidate ? 'Just a sec...' : 'Finding your match...'}
            </Text>
          </View>
        ) : candidate ? (
          <>
            {/* like / dislike — the actual decision, nothing happens automatically */}
            <View style={styles.decisionRow}>
              <TouchableOpacity
                style={styles.passBtn}
                onPress={handlePass}
                activeOpacity={0.8}
              >
                <Text style={styles.passIcon}>✕</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.likeBtn}
                onPress={handleLike}
                activeOpacity={0.8}
              >
                <Text style={styles.likeIcon}>♥</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.creditNote}>Like uses 1 🪙 credit · Pass is free</Text>
          </>
        ) : (
          <>
            {/* swipe button — tap or swipe right to fetch someone to consider */}
            <GestureDetector gesture={swipeGesture}>
              <Animated.View style={[styles.swipeButton, buttonStyle]}>
                <TouchableOpacity
                  style={styles.swipeButtonInner}
                  onPress={handleFindMatch}
                  activeOpacity={0.9}
                >
                  <Animated.View style={[styles.swipeIndicator, swipeIndicatorStyle]}>
                    <Text style={styles.swipeArrows}>⟫⟫⟫</Text>
                  </Animated.View>
                  <Text style={styles.swipeText}>Swipe to find someone special</Text>
                </TouchableOpacity>
              </Animated.View>
            </GestureDetector>

            <Text style={styles.creditNote}>Uses 1 🪙 credit</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    fontSize: 24,
    color: theme.colors.accent,
  },
  logoText: {
    fontFamily: theme.fonts.heading,
    fontSize: 22,
    color: theme.colors.accent,
  },
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  creditsText: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  creditsCount: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 14,
    color: theme.colors.accent,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  accentLine: {
    width: 50,
    height: 3,
    borderRadius: 2,
    marginBottom: theme.spacing.lg,
  },
  heroTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 38,
    color: theme.colors.textPrimary,
    lineHeight: 48,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: theme.spacing.md,
    gap: 8,
  },
  checkmark: {
    color: theme.colors.success,
    fontSize: 16,
    marginTop: 2,
  },
  heroSubtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  filtersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterIcon: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  filtersText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  bottomArea: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  swipeButton: {
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  swipeButtonInner: {
    backgroundColor: theme.colors.crimson,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  swipeIndicator: {
    marginRight: 12,
  },
  swipeArrows: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    fontFamily: theme.fonts.bodySemiBold,
  },
  swipeText: {
    color: '#fff',
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 15,
    flex: 1,
    textAlign: 'center',
  },
  creditNote: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    gap: 12,
  },
  loadingText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  candidatePhoto: {
    width: width - 80,
    height: width - 80,
    borderRadius: theme.radius.lg,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  candidatePhotoFallback: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  candidatePhotoText: {
    fontSize: 64,
    fontFamily: theme.fonts.heading,
    color: theme.colors.textMuted,
  },
  candidateName: {
    fontFamily: theme.fonts.heading,
    fontSize: 26,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  candidateCity: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  decisionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xl,
  },
  passBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passIcon: {
    fontSize: 24,
    color: theme.colors.textSecondary,
  },
  likeBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.crimson,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeIcon: {
    fontSize: 24,
    color: '#fff',
  },
});
