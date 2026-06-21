// SignupScreen.js — registration form
// name, email, password, age, gender toggle

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../AuthContext';
import theme from '../../theme';

const GENDERS = ['Male', 'Female', 'Other'];

export default function SignupScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !age) {
      Alert.alert('Oops', 'Please fill in all fields');
      return;
    }

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 99) {
      Alert.alert('Oops', 'Age must be between 18 and 99');
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password, ageNum, gender);
      // auto-navigates to main app via AuthContext
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
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
        {/* header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Gostart and find your match</Text>
        </View>

        {/* form fields */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={theme.colors.textMuted}
            value={name}
            onChangeText={setName}
          />

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

          <TextInput
            style={styles.input}
            placeholder="Age"
            placeholderTextColor={theme.colors.textMuted}
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            maxLength={2}
          />

          {/* gender toggle */}
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.genderBtn,
                  gender === g && styles.genderActive,
                ]}
                onPress={() => setGender(g)}
              >
                <Text style={[
                  styles.genderText,
                  gender === g && styles.genderTextActive,
                ]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* login link */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.linkWrap}
        >
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkBold}>Login</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontFamily: theme.fonts.heading,
    fontSize: 32,
    color: theme.colors.accent,
  },
  subtitle: {
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
  label: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  genderRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
  },
  genderActive: {
    borderColor: theme.colors.accent,
    backgroundColor: 'rgba(232,197,71,0.1)', // subtle golden tint
  },
  genderText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  genderTextActive: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.bodyMedium,
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
