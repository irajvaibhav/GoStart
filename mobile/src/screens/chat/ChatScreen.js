// ChatScreen.js — 1:1 chat with a match
// uses Socket.IO for real-time messages
// left bubbles = received (dark), right bubbles = sent (crimson)

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../../theme';
import { getMessages, sendMessage as apiSendMessage } from '../../api';
import { useAuth } from '../../AuthContext';

// socket URL — same host as api.js's BASE_URL, just without the /api path
// (Socket.IO connects directly to the server root, not a REST route)
const SOCKET_URL = 'https://gostart-8ytm.onrender.com';

export default function ChatScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { matchId, userName, userPhoto } = route.params || {};

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    connectSocket();

    return () => {
      // cleanup socket on unmount
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await getMessages(matchId);
      const msgs = res.data.messages || res.data || [];
      setMessages(msgs.reverse()); // newest at bottom, FlatList is inverted
    } catch {
      // empty chat is fine
    }
  };

  const connectSocket = async () => {
    const token = await AsyncStorage.getItem('token');

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    // listen for incoming messages - event name must match what server.js
    // emits (io.to(matchId).emit('newMessage', data)) or this never fires
    socketRef.current.on('newMessage', (msg) => {
      // only add if it's for this conversation (room) and not our own
      // optimistic echo coming back (we already added it locally on send)
      if (msg.matchId === matchId && msg.sender !== (user?._id || user?.id)) {
        setMessages((prev) => [msg, ...prev]);
      }
    });

    // join the match's room - server.js does socket.join(matchId) on this
    // event, so we only receive messages for OUR conversation, not every
    // message on the server
    socketRef.current.emit('joinMatch', matchId);
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setText('');

    // optimistic update — show message immediately on our own screen,
    // don't wait for the network round trip
    const tempMsg = {
      _id: `temp_${Date.now()}`,
      text: trimmed,
      sender: user?._id || user?.id,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [tempMsg, ...prev]);

    try {
      // HTTP POST is what actually persists the message to MongoDB
      await apiSendMessage(matchId, trimmed);

      // socket emit is ONLY for pushing it to the other person live - they
      // get it via the 'newMessage' listener above. server.js's handler
      // (io.to(data.matchId).emit('newMessage', data)) just rebroadcasts
      // whatever shape we send here, so it has to include sender/createdAt
      // for the other screen to render and time-stamp it correctly.
      if (socketRef.current) {
        socketRef.current.emit('sendMessage', {
          matchId,
          sender: tempMsg.sender,
          text: trimmed,
          createdAt: tempMsg.createdAt,
        });
      }
    } catch {
      // message already shows, worst case it's not persisted
    } finally {
      setSending(false);
    }
  };

  const isMyMessage = (msg) => {
    const myId = user?._id || user?.id;
    return msg.sender === myId || msg.senderId === myId;
  };

  const renderMessage = ({ item }) => {
    const mine = isMyMessage(item);
    return (
      <View style={[
        styles.bubble,
        mine ? styles.bubbleRight : styles.bubbleLeft,
      ]}>
        <Text style={[
          styles.bubbleText,
          mine ? styles.bubbleTextRight : styles.bubbleTextLeft,
        ]}>
          {item.text}
        </Text>
        <Text style={styles.bubbleTime}>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {userPhoto ? (
            <Image source={{ uri: userPhoto }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.headerAvatarFallback]}>
              <Text style={styles.headerAvatarText}>
                {(userName || '?').charAt(0)}
              </Text>
            </View>
          )}
          <Text style={styles.headerName}>{userName || 'Chat'}</Text>
        </View>

        <View style={{ width: 30 }} />{/* spacer for alignment */}
      </View>

      {/* messages list — inverted so newest at bottom */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id || item.id || String(Math.random())}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />

      {/* input bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backText: {
    fontSize: 24,
    color: theme.colors.textPrimary,
    paddingHorizontal: 8,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  headerAvatarFallback: {
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerAvatarText: {
    fontFamily: theme.fonts.heading,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  headerName: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  messagesContent: {
    padding: theme.spacing.md,
    gap: 8,
  },
  bubble: {
    maxWidth: '78%',
    padding: 12,
    borderRadius: theme.radius.lg,
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: 4, // chat bubble tail
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.crimson,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextLeft: {
    fontFamily: theme.fonts.body,
    color: theme.colors.textPrimary,
  },
  bubbleTextRight: {
    fontFamily: theme.fonts.body,
    color: '#fff',
  },
  bubbleTime: {
    fontFamily: theme.fonts.body,
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: theme.fonts.body,
    color: theme.colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sendBtn: {
    backgroundColor: theme.colors.crimson,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: theme.colors.card,
  },
  sendIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
