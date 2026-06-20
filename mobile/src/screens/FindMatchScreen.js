// FindMatchScreen.js — the hero screen ⭐
// this is the main landing screen from figma
// big gradient bg, "Ready to find your match?" heading
// swipe button at bottom triggers discover API

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withSequence, withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import theme from '../theme';
import { getDiscover, getCredits, likeUser } from '../api';
import { useAuth } from '../AuthContext';

const { width } = Dimensions.get('window');

export default function FindMatchScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(user?.credits ?? 5);

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

  // main action — find a match
  const handleFindMatch = async () => {
    // pulse animation on button
    buttonScale.value = withSequence(
      withSpring(0.95),
      withSpring(1),
    );

    if (credits <= 0) {
      navigation.navigate('DailyReset');
      return;
    }

    setLoading(true);
    try {
      // get available profiles from backend
      const res = await getDiscover();
      const profiles = res.data.profiles || [];

      if (profiles.length === 0) {
        navigation.navigate('DailyReset');
        return;
      }

      // pick the first profile and auto-like them
      const profile = profiles[0];
      const likeRes = await likeUser(profile._id);

      // update credits display
      setCredits(likeRes.data.creditsRemaining ?? credits - 1);

      // pass the real Match document through too (only exists when matched:
      // true) - StartConversationScreen needs its real _id to open the chat.
      // we already recorded the like above, so nothing downstream should
      // call likeUser on this same profile again.
      navigation.navigate('MatchFound', {
        profile,
        isMutualMatch: likeRes.data.matched,
        match: likeRes.data.match,
      });
    } catch (err) {
      if (err.response?.status === 429) {
        // daily swipe limit hit
        navigation.navigate('DailyReset');
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
        // tapping the button. onEnd here already runs on the JS thread
        // (gesture-handler v2 default), so calling the async handler directly is fine
        swipeX.value = withSpring(0);
        handleFindMatch();
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

      {/* hero content */}
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

      {/* bottom swipe area */}
      <View style={styles.bottomArea}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
            <Text style={styles.loadingText}>Finding your match...</Text>
          </View>
        ) : (
          <>
            {/* swipe button — tap or swipe right */}
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
});
