import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { Seal } from "@/components/seal";
import { useLifeStore } from "@/state/store";
import { colors } from "@/theme";

export default function Index() {
  const router = useRouter();
  const { ready, lifePack } = useLifeStore();
  const destination = lifePack ? "/chat" : "/onboarding/create";

  useEffect(() => {
    if (!ready) return;
    router.replace(destination);
  }, [ready, destination, router]);

  return (
    <Screen>
      <View style={styles.center}>
        <Seal size={52} />
        <Text style={styles.word}>数字生命</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  word: {
    color: colors.ink,
    fontSize: 18,
    letterSpacing: 4,
  },
});
