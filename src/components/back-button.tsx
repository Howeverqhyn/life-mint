import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "@/theme";

export function BackButton({ fallback = "/chat" }: { fallback?: "/chat" | "/onboarding/create" }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={10}
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace(fallback);
      }}
      style={styles.button}
    >
      <Text style={styles.text}>返回</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    paddingVertical: 6,
  },
  text: {
    color: colors.inkMuted,
    fontSize: 15,
  },
});
