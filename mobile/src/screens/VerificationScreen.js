// VerificationScreen.js — selfie verification flow
// simple screen: instruction → verify button → success state

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, BounceIn } from 'react-native-reanimated';
import theme from '../theme';
import { verify } from '../api';
import { useAuth } from '../AuthContext';

export default function VerificationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { refreshUser } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await verify();
      setVerified(true);
      // update user data so ProfileScreen shows the badge
      await refreshUser();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {verified ? (
          // ─── success state ───────────────────────
          <Animated.View entering={BounceIn} style={styles.successWrap}>
            <View style={styles.successCircle}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.successTitle}>You're Verified!</Text>
            <Text style={styles.successSubtitle}>
              Your profile now shows a verified badge.{'\n'}
              This helps build trust with your matches.
            </Text>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>Back to Profile</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          // ─── verify state ────────────────────────
          <Animated.View entering={FadeIn} style={styles.verifyWrap}>
            {/* shield icon */}
            <LinearGradient
              colors={theme.colors.golden}
              style={styles.shieldCircle}
            >
              <Text style={styles.shieldIcon}>🛡️</Text>
            </LinearGradient>

            <Text style={styles.title}>Fast Track Verification</Text>

            <Text style={styles.description}>
              Get verified to increase your match chances by 3x.{'\n\n'}
              Upload a selfie and we'll verify your identity.{'\n'}
              Your photo won't be shared — it's only for verification.
            </Text>

            {/* steps */}
            <View style={styles.steps}>
              {[
                '📸  Take a clear selfie',
                '🔍  We verify your identity',
                '✅  Badge appears on your profile',
              ].map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.verifyBtn, verifying && { opacity: 0.6 }]}
              onPress={handleVerify}
              disabled={verifying}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={theme.colors.golden}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.verifyGradient}
              >
                <Text style={styles.verifyBtnText}>
                  {verifying ? 'Verifying...' : 'Verify Now'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
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
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  // verify state
  verifyWrap: {
    alignItems: 'center',
  },
  shieldCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  shieldIcon: {
    fontSize: 36,
  },
  title: {
    fontFamily: theme.fonts.heading,
    fontSize: 28,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: theme.spacing.md,
  },
  steps: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
    alignSelf: 'stretch',
  },
  stepRow: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stepText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  verifyBtn: {
    marginTop: theme.spacing.xl,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  verifyGradient: {
    padding: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.radius.md,
  },
  verifyBtnText: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 16,
    color: '#fff',
  },
  // success state
  successWrap: {
    alignItems: 'center',
  },
  successCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  successIcon: {
    fontSize: 42,
    color: '#fff',
    fontWeight: 'bold',
  },
  successTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 30,
    color: theme.colors.success,
  },
  successSubtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: theme.spacing.md,
  },
  doneBtn: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  doneBtnText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
});
