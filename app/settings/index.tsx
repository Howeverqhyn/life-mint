import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { addFact, ApiError, clearMemory, getMemory } from "@/api/client";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/button";
import { Field } from "@/components/field";
import { Screen } from "@/components/screen";
import { formatDay, formatTimestamp } from "@/format";
import { useLifeStore } from "@/state/store";
import { colors, space } from "@/theme";
import type { LifePack } from "@/types/life-pack";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ready, lifePack, settings, setBaseUrl, clearMessages, resetLocal } = useLifeStore();
  const [baseUrlDraft, setBaseUrlDraft] = useState<string | null>(null);
  const baseUrl = baseUrlDraft ?? settings.baseUrl;
  const [urlNote, setUrlNote] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [facts, setFacts] = useState<LifePack["facts"]>([]);
  const [diary, setDiary] = useState<LifePack["diary"]>([]);
  const [memoryError, setMemoryError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [factText, setFactText] = useState("");
  const [savingFact, setSavingFact] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (leaving && ready && !lifePack) router.replace("/onboarding/create");
  }, [leaving, ready, lifePack, router]);

  const loadMemory = useCallback(async () => {
    if (!lifePack) return;
    setLoading(true);
    setMemoryError(null);
    try {
      const memory = await getMemory(settings.baseUrl, lifePack.id);
      setFacts(memory.facts);
      setDiary(memory.diary);
    } catch (cause) {
      setMemoryError(cause instanceof ApiError ? cause.message : "没有读到记忆。");
    } finally {
      setLoading(false);
    }
  }, [lifePack, settings.baseUrl]);

  useFocusEffect(
    useCallback(() => {
      void loadMemory();
    }, [loadMemory]),
  );

  async function onSaveUrl() {
    const url = baseUrl.trim().replace(/\/$/, "");
    if (!isHttpUrl(url)) {
      setUrlError("服务地址需要以 http:// 或 https:// 开头。");
      setUrlNote(null);
      return;
    }
    setUrlError(null);
    await setBaseUrl(url);
    setBaseUrlDraft(null);
    setUrlNote("已保存。下次聊天会用这个地址。");
  }

  async function onAddFact() {
    if (!lifePack) return;
    const text = factText.trim();
    if (!text) return;
    setSavingFact(true);
    setMemoryError(null);
    try {
      await addFact(settings.baseUrl, lifePack.id, text);
      setFactText("");
      await loadMemory();
    } catch (cause) {
      setMemoryError(cause instanceof ApiError ? cause.message : "这句没有记下。");
    } finally {
      setSavingFact(false);
    }
  }

  function onClearMemory() {
    if (!lifePack) return;
    Alert.alert("清除记忆", "这台手机上的对话会清空。服务上的事实和日记也会清掉。这位生命还在。", [
      { text: "取消", style: "cancel" },
      {
        text: "清除",
        style: "destructive",
        onPress: () => {
          void (async () => {
            await clearMessages();
            try {
              await clearMemory(settings.baseUrl, lifePack.id);
              await loadMemory();
            } catch (cause) {
              setMemoryError(
                cause instanceof ApiError
                  ? `对话已从手机清掉，服务上的记忆还在：${cause.message}`
                  : "对话已从手机清掉，服务上的记忆没能清空。",
              );
            }
          })();
        },
      },
    ]);
  }

  function onReset() {
    Alert.alert("重新开始", "这台手机上的生命和对话会被忘掉。你可以再唤醒一位。", [
      { text: "取消", style: "cancel" },
      {
        text: "忘掉",
        style: "destructive",
        onPress: () => {
          void (async () => {
            await resetLocal();
            setLeaving(true);
          })();
        },
      },
    ]);
  }

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 28) }]}
      >
        <BackButton fallback={lifePack ? "/chat" : "/onboarding/create"} />
        <Text style={styles.title}>设置</Text>

        <Text style={styles.section}>服务</Text>
        <Field
          label="API 地址"
          value={baseUrl}
          onChangeText={(value) => {
            setUrlNote(null);
            setBaseUrlDraft(value);
          }}
          autoCapitalize="none"
          keyboardType="url"
          placeholder="http://192.168.1.8:8787"
          testID="settings-base-url"
          hint="真机请填电脑的局域网 IP，例如 http://192.168.1.8:8787。手机和电脑要在同一个 Wi-Fi。127.0.0.1 只在电脑自己的浏览器里可用。"
        />
        {urlError ? <Text style={styles.error}>{urlError}</Text> : null}
        {urlNote ? <Text style={styles.note}>{urlNote}</Text> : null}
        <Button testID="settings-save-url" label="保存地址" onPress={() => void onSaveUrl()} />

        <Text style={styles.section}>记忆</Text>
        {!lifePack ? (
          <Text style={styles.empty}>还没有生命。先唤醒一位，这里才会有事实和日记。</Text>
        ) : (
          <>
            <Text style={styles.caption}>
              {lifePack.name} · {loading ? "读取中" : `${facts.length} 条事实`}
            </Text>
            {memoryError ? <Text style={styles.error}>{memoryError}</Text> : null}
            {facts.length === 0 && !loading ? (
              <Text style={styles.empty}>还没有事实。</Text>
            ) : (
              facts.map((fact) => (
                <View key={fact.id} style={styles.card}>
                  <Text style={styles.cardText}>{fact.text}</Text>
                  <Text style={styles.cardMeta}>{formatTimestamp(fact.createdAt)}</Text>
                </View>
              ))
            )}
            <Field
              label="记下一句"
              value={factText}
              onChangeText={setFactText}
              placeholder="例如：我喜欢下雨天走路"
              testID="settings-fact"
            />
            <Button
              label={savingFact ? "记下中" : "记下"}
              tone="quiet"
              onPress={() => void onAddFact()}
              disabled={savingFact || !factText.trim()}
            />

            <Text style={styles.section}>日记</Text>
            {diary.length === 0 && !loading ? (
              <Text style={styles.empty}>还没有日记。</Text>
            ) : (
              diary.map((entry) => (
                <View key={entry.id} style={styles.card}>
                  <Text style={styles.cardMeta}>{formatDay(entry.date)}</Text>
                  <Text style={styles.cardText}>{entry.text}</Text>
                </View>
              ))
            )}

            <Button testID="settings-refresh" label="重新读取" tone="quiet" onPress={() => void loadMemory()} />
            <Button testID="settings-clear-memory" label="清除记忆" tone="danger" onPress={onClearMemory} />
          </>
        )}

        <Text style={styles.section}>这台手机</Text>
        <Text style={styles.empty}>忘掉本地保存的生命和对话，回到唤醒页。服务进程里的记录要等 API 重启才消失。</Text>
        <Button label="重新开始" tone="danger" onPress={onReset} disabled={!lifePack} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    gap: 12,
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 4,
  },
  section: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },
  caption: {
    color: colors.inkMuted,
    fontSize: 13,
  },
  empty: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  error: {
    color: colors.cinnabar,
    fontSize: 14,
    lineHeight: 20,
  },
  note: {
    color: colors.moss,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  cardText: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 22,
  },
  cardMeta: {
    color: colors.inkMuted,
    fontSize: 12,
  },
});
