// LoginScreen.js — simple email/password login
// dark theme, golden logo, crimson button

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../AuthContext';
import theme from '../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Oops', 'Fill in both fields');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      // navigation happens automatically via AuthContext → AppNavigator
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed, try again';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* golden heart logo */}
        <View style={styles.logoWrap}>
          <LinearGradient
            colors={theme.colors.golden}
            style={styles.logoHeart}
          >
            <Text style={styles.heartIcon}>♥</Text>
          </LinearGradient>
          <Text style={styles.logoText}>Gostart</Text>
          <Text style={styles.tagline}>Find your perfect match</Text>
        </View>

        {/* form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={theme.colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={theme.colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* signup link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Signup')}
          style={styles.linkWrap}
        >
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkBold}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logoHeart: {
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  heartIcon: {
    fontSize: 32,
    color: '#fff',
  },
  logoText: {
    fontFamily: theme.fonts.heading,
    fontSize: 36,
    color: theme.colors.accent,
  },
  tagline: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  form: {
    gap: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.textPrimary,
  },
  button: {
    backgroundColor: theme.colors.crimson,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 16,
  },
  linkWrap: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  linkText: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
  },
  linkBold: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.bodyMedium,
  },
});
