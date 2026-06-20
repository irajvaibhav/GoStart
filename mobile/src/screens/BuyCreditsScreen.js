// BuyCreditsScreen.js — credit packs paywall
// three packs with golden borders, mock purchase

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../theme';
import { getCredits, purchaseCredits } from '../api';

// hardcoded packs — ideally these come from getPackages() API.
// ids MUST match backend/routes/credits.js's PACKAGES array (1, 2, 3) -
// purchaseCredits(id) sends this id straight through, and the backend does
// PACKAGES.find(p => p.id === packageId). string ids here would never match
// the backend's numeric ones and every purchase would fail as "Invalid package".
const PACKS = [
  { id: 1, credits: 10, price: '₹99', popular: false },
  { id: 2, credits: 25, price: '₹199', popular: true },
  { id: 3, credits: 50, price: '₹349', popular: false },
];

export default function BuyCreditsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState(0);
  const [purchasing, setPurchasing] = useState(null); // which pack is being purchased
  const [loadingBalance, setLoadingBalance] = useState(true);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await getCredits();
      setBalance(res.data.credits ?? res.data.balance ?? 0);
    } catch {
      // fallback to 0
    } finally {
      setLoadingBalance(false);
    }
  };

  const handlePurchase = async (pack) => {
    setPurchasing(pack.id);
    try {
      await purchaseCredits(pack.id);
      // mock: add credits locally too
      setBalance((b) => b + pack.credits);
      Alert.alert('Success! 🎉', `${pack.credits} credits added to your account`);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Get More Credits</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* current balance */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        {loadingBalance ? (
          <ActivityIndicator color={theme.colors.accent} />
        ) : (
          <Text style={styles.balanceValue}>{balance} 🪙</Text>
        )}
      </View>

      {/* credit packs */}
      <View style={styles.packsWrap}>
        {PACKS.map((pack) => (
          <TouchableOpacity
            key={pack.id}
            activeOpacity={0.8}
            onPress={() => handlePurchase(pack)}
            disabled={purchasing !== null}
          >
            <View style={[
              styles.packCard,
              pack.popular && styles.packPopular,
            ]}>
              {/* popular badge */}
              {pack.popular && (
                <LinearGradient
                  colors={theme.colors.golden}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.popularBadge}
                >
                  <Text style={styles.popularText}>Most Popular</Text>
                </LinearGradient>
              )}

              <Text style={styles.packCredits}>{pack.credits} Credits</Text>
              <Text style={styles.packPrice}>{pack.price}</Text>

              {purchasing === pack.id && (
                <ActivityIndicator
                  color={theme.colors.accent}
                  style={{ marginTop: 8 }}
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* info text */}
      <Text style={styles.infoText}>
        Credits are used to discover matches and start conversations.{'\n'}
        1 credit = 1 match discovery.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  headerTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    color: theme.colors.textPrimary,
  },
  balanceCard: {
    margin: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  balanceLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  balanceValue: {
    fontFamily: theme.fonts.heading,
    fontSize: 36,
    color: theme.colors.accent,
    marginTop: 4,
  },
  packsWrap: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  packCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  packPopular: {
    borderColor: theme.colors.accent,
    borderWidth: 1.5,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: theme.radius.sm,
  },
  popularText: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 10,
    color: '#fff',
  },
  packCredits: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  packPrice: {
    fontFamily: theme.fonts.heading,
    fontSize: 22,
    color: theme.colors.accent,
  },
  infoText: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
});
