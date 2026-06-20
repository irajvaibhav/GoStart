// FiltersScreen.js — match preferences
// gender toggle, age range, location, religion, profession
// saves to backend via updatePreferences

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../theme';
import { updatePreferences } from '../api';

const RELIGIONS = ['Any', 'Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Other'];

export default function FiltersScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // filter state — defaults
  const [lookingFor, setLookingFor] = useState('Women'); // Men or Women
  const [ageMin, setAgeMin] = useState('21');
  const [ageMax, setAgeMax] = useState('30');
  const [location, setLocation] = useState('Nearby'); // Nearby or Same City
  const [religion, setReligion] = useState('Any');
  const [profession, setProfession] = useState('');
  const [saving, setSaving] = useState(false);

  const handleApply = async () => {
    setSaving(true);
    try {
      // heads up: religion/profession are sent here but PUT /api/users/preferences
      // only reads lookingFor/ageMin/ageMax/location - these two fields get
      // silently dropped server-side, and discover's filter doesn't use them
      // either. not wired up to anything yet, kept here so the form fields
      // have somewhere to "go" without throwing.
      await updatePreferences({
        lookingFor: lookingFor.toLowerCase(),
        ageMin: parseInt(ageMin) || 18,
        ageMax: parseInt(ageMax) || 50,
        location: location.toLowerCase(),
        religion: religion === 'Any' ? '' : religion,
        profession: profession.trim(),
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to save filters');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filters</Text>
        <View style={{ width: 50 }} />{/* spacer */}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* looking for */}
        <Text style={styles.label}>I'm looking for</Text>
        <View style={styles.toggleRow}>
          {['Men', 'Women'].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.toggle, lookingFor === opt && styles.toggleActive]}
              onPress={() => setLookingFor(opt)}
            >
              <Text style={[
                styles.toggleText,
                lookingFor === opt && styles.toggleTextActive,
              ]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* age range */}
        <Text style={styles.label}>Age range</Text>
        <View style={styles.ageRow}>
          <TextInput
            style={styles.ageInput}
            placeholder="Min"
            placeholderTextColor={theme.colors.textMuted}
            value={ageMin}
            onChangeText={setAgeMin}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={styles.ageDash}>—</Text>
          <TextInput
            style={styles.ageInput}
            placeholder="Max"
            placeholderTextColor={theme.colors.textMuted}
            value={ageMax}
            onChangeText={setAgeMax}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>

        {/* location */}
        <Text style={styles.label}>Location</Text>
        <View style={styles.toggleRow}>
          {['Nearby', 'Same City'].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.toggle, location === opt && styles.toggleActive]}
              onPress={() => setLocation(opt)}
            >
              <Text style={[
                styles.toggleText,
                location === opt && styles.toggleTextActive,
              ]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* religion */}
        <Text style={styles.label}>Religion (Optional)</Text>
        <View style={styles.chipRow}>
          {RELIGIONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.chip, religion === r && styles.chipActive]}
              onPress={() => setReligion(r)}
            >
              <Text style={[
                styles.chipText,
                religion === r && styles.chipTextActive,
              ]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* profession */}
        <Text style={styles.label}>Profession (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Doctor, Engineer, Student..."
          placeholderTextColor={theme.colors.textMuted}
          value={profession}
          onChangeText={setProfession}
        />
      </ScrollView>

      {/* apply button fixed at bottom */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.applyBtn, saving && { opacity: 0.6 }]}
          onPress={handleApply}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.applyText}>
            {saving ? 'Saving...' : 'Apply'}
          </Text>
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
  scroll: {
    padding: theme.spacing.lg,
    paddingBottom: 100, // room for fixed footer
  },
  label: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  toggle: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
  },
  toggleActive: {
    borderColor: theme.colors.crimson,
    backgroundColor: 'rgba(139,0,0,0.15)',
  },
  toggleText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  toggleTextActive: {
    color: '#fff',
    fontFamily: theme.fonts.bodyMedium,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  ageInput: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  ageDash: {
    color: theme.colors.textMuted,
    fontSize: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  chipActive: {
    borderColor: theme.colors.accent,
    backgroundColor: 'rgba(232,197,71,0.1)',
  },
  chipText: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  chipTextActive: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.bodyMedium,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.textPrimary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.bg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  applyBtn: {
    backgroundColor: theme.colors.crimson,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  applyText: {
    color: '#fff',
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 16,
  },
});
