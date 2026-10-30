import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme";

export function Seal({ char = "生", size = 36 }: { char?: string; size?: number }) {
  return (
    <View
      style={[
        styles.seal,
        {
          width: size,
          height: size,
          borderRadius: Math.max(4, size * 0.12),
        },
      ]}
    >
      <Text style={[styles.char, { fontSize: size * 0.46 }]}>{char}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  seal: {
    backgroundColor: colors.cinnabar,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-8deg" }],
  },
  char: {
    color: colors.paperRaised,
    fontWeight: "700",
  },
});
