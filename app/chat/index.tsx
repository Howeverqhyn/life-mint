import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError, sendChat } from "@/api/client";
import { Avatar } from "@/components/avatar";
import { Screen } from "@/components/screen";
import { createId } from "@/format";
import { useLifeStore } from "@/state/store";
import { colors, space } from "@/theme";
import type { ChatMessage } from "@/types/chat";

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ready, lifePack, settings, messages, appendMessages } = useLifeStore();
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (ready && !lifePack) router.replace("/onboarding/create");
  }, [ready, lifePack, router]);

  const thread = useMemo(() => {
    if (!lifePack) return messages;
    const opening: ChatMessage = {
      id: "opening",
      role: "life",
      text: lifePack.opening,
      createdAt: lifePack.createdAt,
    };
    return [opening, ...messages];
  }, [lifePack, messages]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [thread.length]);

  async function onSend() {
    if (!lifePack || pending) return;
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setError(null);
    setPending(true);
    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };
    try {
      await appendMessages([userMessage]);
      const { reply } = await sendChat(settings.baseUrl, lifePack.id, text);
      await appendMessages([
        {
          id: createId(),
          role: "life",
          text: reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "这句没有送出去。");
    } finally {
      setPending(false);
    }
  }

  if (!lifePack) {
    return (
      <Screen>
        <View style={styles.waiting}>
          <Text style={styles.waitingText}>正在打开对话</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Avatar uri={lifePack.avatarUrl} label={lifePack.name} size={52} />
          <View style={styles.headerText}>
            <Text style={styles.name} numberOfLines={1}>
              {lifePack.name}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {lifePack.persona.relationship} · {lifePack.persona.voice}
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push("/avatar")} hitSlop={8}>
            <Text style={styles.link}>形象</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push("/settings")} hitSlop={8}>
            <Text style={styles.link}>设置</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          style={styles.flex}
          data={thread}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const mine = item.role === "user";
            return (
              <View style={[styles.row, mine ? styles.rowMine : styles.rowLife]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleLife]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.text}</Text>
                </View>
              </View>
            );
          }}
        />

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.composerRow}>
            <TextInput
              testID="chat-input"
              value={draft}
              onChangeText={setDraft}
              placeholder={pending ? "它在想" : "说一句"}
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
              multiline
              maxLength={2000}
              editable={!pending}
              selectionColor={colors.cinnabar}
            />
            <Pressable
              testID="chat-send"
              accessibilityRole="button"
              accessibilityLabel="送出"
              disabled={pending || !draft.trim()}
              onPress={() => void onSend()}
              style={({ pressed }) => [
                styles.send,
                (pending || !draft.trim()) && styles.sendDisabled,
                pressed && styles.sendPressed,
              ]}
            >
              <Text style={styles.sendText}>{pending ? "…" : "送出"}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  waiting: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  waitingText: {
    color: colors.inkMuted,
    fontSize: 15,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  meta: {
    color: colors.inkMuted,
    fontSize: 13,
  },
  link: {
    color: colors.moss,
    fontSize: 14,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    gap: 10,
  },
  row: {
    flexDirection: "row",
  },
  rowLife: {
    justifyContent: "flex-start",
  },
  rowMine: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "84%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleLife: {
    backgroundColor: colors.paperRaised,
    borderWidth: 1,
    borderColor: colors.line,
    borderBottomLeftRadius: 4,
  },
  bubbleMine: {
    backgroundColor: colors.ink,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 24,
  },
  bubbleTextMine: {
    color: colors.paperRaised,
  },
  composer: {
    paddingHorizontal: space.md,
    paddingTop: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.paper,
  },
  error: {
    color: colors.cinnabar,
    fontSize: 13,
    lineHeight: 18,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paperRaised,
    color: colors.ink,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  send: {
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: colors.cinnabar,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: {
    opacity: 0.45,
  },
  sendPressed: {
    opacity: 0.78,
  },
  sendText: {
    color: colors.paperRaised,
    fontSize: 15,
    fontWeight: "700",
  },
});
