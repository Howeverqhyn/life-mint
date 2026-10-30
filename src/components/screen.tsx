import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme";

export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.outer}>
      <View style={[styles.frame, { paddingTop: insets.top }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  frame: {
    flex: 1,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
});
