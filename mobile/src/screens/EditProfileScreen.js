// EditProfileScreen.js — edit your own profile + change your photo
// loads current values from AuthContext's `user`, lets you change them,
// saves via PUT /api/users/profile. photo is separate - tapping it opens
// the device's photo picker and uploads right away (POST /api/users/photos),
// no need to also hit "Save" for that part.

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Image, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../theme';
import { useAuth } from '../AuthContext';
import { updateProfile, uploadPhoto, resolvePhotoUrl } from '../api';

export default function EditProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();

  // pre-fill every field from whatever the user already has saved
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [city, setCity] = useState(user?.city || '');
  const [profession, setProfession] = useState(user?.profession || '');
  const [bio, setBio] = useState(user?.bio || '');
  // interests are stored as an array in the DB, but a plain comma-separated
  // text field is the simplest way to edit a list - no fancy chip-picker
  // needed for this
  const [interests, setInterests] = useState((user?.interests || []).join(', '));

  const [photo, setPhoto] = useState(resolvePhotoUrl(user?.photos?.[0]));
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7, // compress a bit, no need for full camera resolution here
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.canceled) return;

    const localUri = result.assets[0].uri;
    setUploadingPhoto(true);
    try {
      const res = await uploadPhoto(localUri);
      const newPhotos = res.data.photos || [];
      setPhoto(resolvePhotoUrl(newPhotos[newPhotos.length - 1]));
      await refreshUser(); // so the rest of the app (ProfileScreen etc) sees it too
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Could not upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        age: Number(age) || undefined,
        city: city.trim(),
        profession: profession.trim(),
        bio: bio.trim(),
        // split on commas, trim each one, drop any empty entries from
        // stray commas (e.g. "music, , travel")
        interests: interests.split(',').map(i => i.trim()).filter(Boolean),
      });
      await refreshUser();
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 50 }} />{/* spacer to center the title */}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* photo - tap to change, uploads immediately */}
        <TouchableOpacity
          style={styles.photoWrap}
          onPress={handlePickPhoto}
          disabled={uploadingPhoto}
          activeOpacity={0.8}
        >
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <LinearGradient colors={['#2A2A2A', '#1A1A1A']} style={styles.photo}>
              <Text style={styles.photoInitial}>
                {(name || '?').charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
          <View style={styles.photoOverlay}>
            {uploadingPhoto ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.photoOverlayText}>Change Photo</Text>
            )}
          </View>
        </TouchableOpacity>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor={theme.colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          placeholder="Your age"
          placeholderTextColor={theme.colors.textMuted}
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          maxLength={2}
        />

        <Text style={styles.label}>City</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Mumbai"
          placeholderTextColor={theme.colors.textMuted}
          value={city}
          onChangeText={setCity}
        />

        <Text style={styles.label}>Profession</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Software Engineer"
          placeholderTextColor={theme.colors.textMuted}
          value={profession}
          onChangeText={setProfession}
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          placeholder="Tell people about yourself..."
          placeholderTextColor={theme.colors.textMuted}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Interests (comma separated)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Travel, Music, Cooking"
          placeholderTextColor={theme.colors.textMuted}
          value={interests}
          onChangeText={setInterests}
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
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
  photoWrap: {
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoInitial: {
    fontFamily: theme.fonts.heading,
    fontSize: 48,
    color: theme.colors.textMuted,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 6,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    alignItems: 'center',
  },
  photoOverlayText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
    color: '#fff',
  },
  label: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
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
  bioInput: {
    minHeight: 90,
    textAlignVertical: 'top',
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
  saveBtn: {
    backgroundColor: theme.colors.crimson,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 16,
  },
});
