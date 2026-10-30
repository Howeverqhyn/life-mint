import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/avatar";
import { BackButton } from "@/components/back-button";
import { Screen } from "@/components/screen";
import { PRESET_AVATARS } from "@/presets/avatars";
import { useLifeStore } from "@/state/store";
import { colors, space } from "@/theme";

export default function AvatarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ready, lifePack, updateAvatar } = useLifeStore();
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !lifePack) router.replace("/onboarding/create");
  }, [ready, lifePack, router]);

  if (!lifePack) {
    return (
      <Screen>
        <View style={styles.waiting}>
          <Text style={styles.waitingText}>正在打开形象</Text>
        </View>
      </Screen>
    );
  }

  const current = PRESET_AVATARS.find((preset) => preset.url === lifePack.avatarUrl);

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 28) }]}>
        <BackButton />
        <Text style={styles.title}>样子</Text>
        <Text style={styles.subtitle}>换成另一张预设的脸。只改这台手机上的显示。</Text>
        <View style={styles.preview}>
          <Avatar uri={lifePack.avatarUrl} label={lifePack.name} size={168} selected />
          <Text style={styles.previewName}>{lifePack.name}</Text>
          <Text style={styles.previewMeta}>{current ? current.name : "自定义"}</Text>
          {note ? <Text style={styles.note}>{note}</Text> : null}
        </View>
        <View style={styles.grid}>
          {PRESET_AVATARS.map((preset) => {
            const selected = preset.url === lifePack.avatarUrl;
            return (
              <Pressable
                key={preset.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={preset.name}
                onPress={() => {
                  void updateAvatar(preset.url);
                  setNote(`已换成「${preset.name}」`);
                }}
                style={styles.cell}
              >
                <Avatar uri={preset.url} label={preset.name} size={84} selected={selected} />
                <Text style={[styles.cellName, selected && styles.cellNameOn]}>{preset.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    gap: space.sm,
  },
  waiting: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  waitingText: {
    color: colors.inkMuted,
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: "700",
    marginTop: 8,
  },
  subtitle: {
    color: colors.inkMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  preview: {
    alignItems: "center",
    gap: 8,
    paddingVertical: space.md,
  },
  previewName: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "700",
  },
  previewMeta: {
    color: colors.inkMuted,
    fontSize: 14,
  },
  note: {
    color: colors.moss,
    fontSize: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 12,
    rowGap: 16,
  },
  cell: {
    width: "30%",
    alignItems: "center",
    gap: 6,
  },
  cellName: {
    color: colors.inkMuted,
    fontSize: 13,
  },
  cellNameOn: {
    color: colors.cinnabar,
  },
});
