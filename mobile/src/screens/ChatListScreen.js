// ChatListScreen.js — list of all conversations
// shows matched users with last message preview

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import theme from '../theme';
import { getConversations, resolvePhotoUrl } from '../api';

export default function ChatListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  // refetch when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );

  const fetchConversations = async () => {
    try {
      const res = await getConversations();
      setConversations(res.data.conversations || res.data || []);
    } catch {
      // silent fail, show empty list
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    // today → show time, otherwise show date
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderItem = ({ item }) => {
    // backend's GET /api/chat/conversations returns { matchId, matchedAt,
    // user, lastMessage } - "user" not "otherUser", and there's no plain
    // _id field, so item.matchId is the only real identifier here
    const otherUser = item.otherUser || item.user || {};
    const otherPhoto = resolvePhotoUrl(otherUser.photos?.[0]);
    // lastMessage comes back as an OBJECT ({ text, sender, createdAt }) or
    // null, never a plain string - rendering item.lastMessage directly would
    // crash <Text> ("Objects are not valid as a React child")
    const previewText = item.lastMessage?.text || 'Say hi! 👋';
    return (
      <TouchableOpacity
        style={styles.chatRow}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('Chat', {
            matchId: item._id || item.id || item.matchId,
            userName: otherUser.name || 'Unknown',
            userPhoto: otherPhoto,
          })
        }
      >
        {/* avatar */}
        {otherPhoto ? (
          <Image source={{ uri: otherPhoto }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>
              {(otherUser.name || '?').charAt(0)}
            </Text>
          </View>
        )}

        {/* name + last message */}
        <View style={styles.chatInfo}>
          <Text style={styles.chatName} numberOfLines={1}>
            {otherUser.name || 'Unknown'}
          </Text>
          <Text style={styles.chatPreview} numberOfLines={1}>
            {previewText}
          </Text>
        </View>

        {/* timestamp - backend doesn't send lastMessageAt/updatedAt, only
            lastMessage.createdAt (or matchedAt if no messages yet) */}
        <Text style={styles.chatTime}>
          {formatTime(item.lastMessage?.createdAt || item.matchedAt)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>Messages</Text>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySubtitle}>
            Find a match to start chatting!
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id || item.id || item.matchId || String(Math.random())}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    fontFamily: theme.fonts.heading,
    fontSize: 28,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarFallback: {
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatarText: {
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    color: theme.colors.textMuted,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  chatPreview: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  chatTime: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 22,
    color: theme.colors.textPrimary,
  },
  emptySubtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
});
