// ProfileScreen.js — user's own profile
// shows photo, bio, interests, credits, edit + logout buttons

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../../theme';
import { useAuth } from '../../AuthContext';
import { getCredits, resolvePhotoUrl } from '../../api';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout, refreshUser } = useAuth();
  const [credits, setCredits] = useState(0);

  // refresh data when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshUser();
      fetchCredits();
    }, [])
  );

  const fetchCredits = async () => {
    try {
      const res = await getCredits();
      setCredits(res.data.credits ?? res.data.balance ?? 0);
    } catch {
      // keep 0
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  // safe access — user might be null briefly
  const name = user?.name || 'User';
  const age = user?.age || '';
  const city = user?.city || '';
  const bio = user?.bio || 'No bio yet. Tell people about yourself!';
  const interests = user?.interests || [];
  const isVerified = user?.isVerified || false;
  // User schema stores a `photos` array, not a singular `photo` field.
  // resolvePhotoUrl turns the backend's relative "/uploads/xxx.jpg" path
  // into a full URL the <Image> component can actually load
  const photo = resolvePhotoUrl(user?.photos?.[0]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Profile</Text>

        {/* profile photo */}
        <View style={styles.photoSection}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <LinearGradient
              colors={['#2A2A2A', '#1A1A1A']}
              style={styles.photo}
            >
              <Text style={styles.photoInitial}>
                {name.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}

          {/* verified badge overlay */}
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✓</Text>
            </View>
          )}
        </View>

        {/* name, age, city */}
        <Text style={styles.nameText}>
          {name}{age ? `, ${age}` : ''}
        </Text>
        {city ? <Text style={styles.cityText}>{city}</Text> : null}

        {/* verification status */}
        <TouchableOpacity
          style={[
            styles.verifyBtn,
            isVerified && styles.verifyBtnDone,
          ]}
          onPress={() => {
            if (!isVerified) navigation.navigate('Verification');
          }}
          disabled={isVerified}
        >
          <Text style={styles.verifyIcon}>{isVerified ? '✓' : '⚡'}</Text>
          <Text style={[
            styles.verifyText,
            isVerified && styles.verifyTextDone,
          ]}>
            {isVerified ? 'Verified' : 'Get Verified'}
          </Text>
        </TouchableOpacity>

        {/* bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <Text style={styles.bioText}>{bio}</Text>
        </View>

        {/* interests */}
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

        {/* credits balance */}
        <View style={styles.creditsCard}>
          <View>
            <Text style={styles.creditsLabel}>Credits Balance</Text>
            <Text style={styles.creditsValue}>{credits} 🪙</Text>
          </View>
          <TouchableOpacity
            style={styles.buyBtn}
            onPress={() =>
              navigation.navigate('Find Match', {
                screen: 'BuyCredits',
              })
            }
          >
            <Text style={styles.buyBtnText}>Get More</Text>
          </TouchableOpacity>
        </View>

        {/* action buttons */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('EditProfile')}
          activeOpacity={0.8}
        >
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
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
  header: {
    fontFamily: theme.fonts.heading,
    fontSize: 28,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoInitial: {
    fontFamily: theme.fonts.heading,
    fontSize: 48,
    color: theme.colors.textMuted,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: theme.colors.success,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.bg,
  },
  verifiedIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nameText: {
    fontFamily: theme.fonts.heading,
    fontSize: 26,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  cityText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    marginTop: theme.spacing.md,
    backgroundColor: 'rgba(232,197,71,0.1)',
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  verifyBtnDone: {
    borderColor: theme.colors.success,
    backgroundColor: 'rgba(46,204,113,0.1)',
  },
  verifyIcon: {
    fontSize: 14,
  },
  verifyText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    color: theme.colors.accent,
  },
  verifyTextDone: {
    color: theme.colors.success,
  },
  section: {
    marginTop: theme.spacing.xl,
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
    backgroundColor: 'rgba(232,197,71,0.1)',
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
  creditsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  creditsLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  creditsValue: {
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    color: theme.colors.accent,
    marginTop: 2,
  },
  buyBtn: {
    backgroundColor: 'rgba(232,197,71,0.15)',
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  buyBtnText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    color: theme.colors.accent,
  },
  editBtn: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  editBtnText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  logoutBtn: {
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  logoutBtnText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.crimson,
  },
});
