// StartConversationScreen.js — confirmation modal
// "starting this convo uses 1 credit" overlay
// presented as transparent modal (see navigator config)

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Image,
} from 'react-native';
import theme from '../../theme';
import { resolvePhotoUrl } from '../../api';

export default function StartConversationScreen({ route, navigation }) {
  const profile = route.params?.profile || {};
  // profile has a `photos` ARRAY (matches the User schema), there's no
  // singular `photo` field - grab the first one for the avatar here
  const profilePhoto = resolvePhotoUrl(profile.photos?.[0]);
  // the real Match document (has the _id chat.js actually needs) - passed
  // through from FindMatchScreen -> MatchFoundScreen -> here. profile._id is
  // the OTHER PERSON's id, not a match id, so it can't be used for chat routes.
  const match = route.params?.match;
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    // we already liked this person back in FindMatchScreen - liking again
    // here would just get rejected by the backend ("Already swiped on this
    // user"), so this just needs to open the chat that already exists.
    if (!match?._id) {
      Alert.alert('Error', 'This match could not be found');
      return;
    }

    setLoading(true);
    try {
      // navigate to chat — go back to tabs first, then into messages
      navigation.popToTop();
      navigation.navigate('Messages', {
        screen: 'Chat',
        params: {
          matchId: match._id,
          userName: profile.name,
          userPhoto: profilePhoto,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.overlay}>
      {/* tap outside to dismiss */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={() => navigation.goBack()}
      />

      {/* bottom card */}
      <View style={styles.card}>
        {/* small profile pic */}
        <View style={styles.profileRow}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {(profile.name || '?').charAt(0)}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.nameText}>
              {profile.name}, {profile.age}
            </Text>
            <Text style={styles.cityText}>
              {profile.city}{profile.distance ? ` · ${profile.distance} km away` : ''}
            </Text>
          </View>
        </View>

        {/* credit info */}
        <Text style={styles.infoText}>
          Starting this conversation uses 1 credit.{'\n'}
          You'll both be connected in chat.
        </Text>

        {/* confirm button */}
        <TouchableOpacity
          style={[styles.confirmBtn, loading && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmText}>
            {loading ? 'Connecting...' : 'Yes, Start Conversation'}
          </Text>
        </TouchableOpacity>

        {/* not now */}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelText}>Not Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)', // dark overlay
  },
  backdrop: {
    flex: 1,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    color: theme.colors.textMuted,
  },
  nameText: {
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  cityText: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  infoText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  confirmBtn: {
    backgroundColor: theme.colors.crimson,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 16,
  },
  cancelBtn: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
  },
  cancelText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
});
