import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError, createLife } from "@/api/client";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { MultiChips, SuggestionChips } from "@/components/chips";
import { Field } from "@/components/field";
import { Screen } from "@/components/screen";
import { Seal } from "@/components/seal";
import { PRESET_AVATARS } from "@/presets/avatars";
import { RELATIONSHIPS, TRAITS, VOICES } from "@/presets/persona";
import { useLifeStore } from "@/state/store";
import { colors, space } from "@/theme";

function splitList(value: string): string[] {
  return value
    .split(/[,，、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function CreateLifeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ready, settings, setBaseUrl, saveLifePack, lifePack } = useLifeStore();
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<string>(RELATIONSHIPS[0]);
  const [voice, setVoice] = useState<string>(VOICES[0]);
  const [traits, setTraits] = useState<string[]>([TRAITS[0]]);
  const [taboos, setTaboos] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0]?.url ?? "");
  const [baseUrlDraft, setBaseUrlDraft] = useState<string | null>(null);
  const baseUrl = baseUrlDraft ?? settings.baseUrl;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    if (createdId && lifePack?.id === createdId) {
      router.replace("/chat");
    }
  }, [createdId, lifePack, router]);

  async function onSubmit() {
    const trimmedName = name.trim();
    const trimmedRelationship = relationship.trim();
    const trimmedVoice = voice.trim() || VOICES[0];
    const url = baseUrl.trim().replace(/\/$/, "");
    const tabooList = splitList(taboos);
    if (!trimmedName) {
      setError("先起一个名字。");
      return;
    }
    if (!trimmedRelationship) {
      setError("写上你们的关系。");
      return;
    }
    if (!isHttpUrl(url)) {
      setError("服务地址需要以 http:// 或 https:// 开头。");
      return;
    }
    setError(null);
    setPending(true);
    try {
      await setBaseUrl(url);
      const pack = await createLife(url, {
        name: trimmedName,
        avatarUrl,
        persona: {
          voice: trimmedVoice,
          traits: traits.length ? traits : [TRAITS[0]],
          relationship: trimmedRelationship,
          taboos: tabooList.length ? tabooList : undefined,
        },
        memoryPolicy: {
          remember: ["名字", "关系", "用户要求记住的事"],
          forget: tabooList,
          decayDays: 30,
        },
      });
      await saveLifePack(pack);
      setCreatedId(pack.id);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "没有唤醒成功。");
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}
      >
        <View style={styles.hero}>
          <Seal />
          <Text style={styles.kicker}>数字生命</Text>
        </View>
        <Text style={styles.title}>唤醒一位生命</Text>
        <Text style={styles.subtitle}>给它名字、说话的方式和你们的关系。它会住在这台手机里。</Text>

        <Text style={styles.section}>样子</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatars}>
          {PRESET_AVATARS.map((preset) => {
            const selected = preset.url === avatarUrl;
            return (
              <Pressable
                key={preset.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={preset.name}
                onPress={() => setAvatarUrl(preset.url)}
                style={styles.avatarItem}
              >
                <Avatar uri={preset.url} label={preset.name} size={72} selected={selected} />
                <Text style={[styles.avatarName, selected && styles.avatarNameOn]}>{preset.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Field label="名字" value={name} onChangeText={setName} placeholder="例如：林间" maxLength={40} testID="create-name" />

        <View style={styles.block}>
          <Text style={styles.section}>关系</Text>
          <SuggestionChips options={RELATIONSHIPS} value={relationship} onChange={setRelationship} />
          <Field
            label="也可以自己写"
            value={relationship}
            onChangeText={setRelationship}
            placeholder="你们是什么关系"
            maxLength={24}
          />
        </View>

        <View style={styles.block}>
          <Text style={styles.section}>说话</Text>
          <SuggestionChips options={VOICES} value={voice} onChange={setVoice} />
          <Field label="语气" value={voice} onChangeText={setVoice} placeholder="它怎么说话" maxLength={40} />
        </View>

        <View style={styles.block}>
          <Text style={styles.section}>性情</Text>
          <MultiChips options={TRAITS} value={traits} onChange={setTraits} />
        </View>

        <Field
          label="不想让它提起的（可选）"
          value={taboos}
          onChangeText={setTaboos}
          placeholder="用逗号分开，例如：工作，旧地址"
          hint="这些词会放进记忆策略的 forget。聊天里碰到时，它会放下，不记成事实。"
        />

        <Field
          label="服务地址"
          value={baseUrl}
          onChangeText={setBaseUrlDraft}
          placeholder="http://192.168.1.8:8787"
          autoCapitalize="none"
          keyboardType="url"
          testID="create-base-url"
          hint={
            ready
              ? "手机和电脑要在同一个 Wi-Fi。填电脑的局域网地址，例如 http://192.168.1.8:8787。127.0.0.1 是手机自己，真机上连不上电脑。"
              : "正在读取本机保存的地址。"
          }
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          testID="create-submit"
          label={pending ? "唤醒中" : "唤醒"}
          onPress={() => void onSubmit()}
          disabled={pending || !ready}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: space.md,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  kicker: {
    color: colors.inkMuted,
    fontSize: 14,
    letterSpacing: 3,
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.inkMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600",
  },
  avatars: {
    gap: 12,
    paddingVertical: 4,
  },
  avatarItem: {
    alignItems: "center",
    gap: 6,
  },
  avatarName: {
    color: colors.inkMuted,
    fontSize: 13,
  },
  avatarNameOn: {
    color: colors.cinnabar,
  },
  block: {
    gap: 10,
  },
  error: {
    color: colors.cinnabar,
    fontSize: 14,
    lineHeight: 20,
  },
});
