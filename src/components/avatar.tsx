import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme";

type Props = {
  uri: string;
  label: string;
  size?: number;
  selected?: boolean;
};

export function Avatar({ uri, label, size = 64, selected = false }: Props) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const failed = failedUri === uri;

  const ring = size + 8;
  const initial = label.trim().slice(0, 1) || "生";

  return (
    <View
      style={[
        styles.ring,
        {
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          borderColor: selected ? colors.cinnabar : "transparent",
        },
      ]}
    >
      {failed || !uri ? (
        <View
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.initial, { fontSize: size * 0.38 }]}>{initial}</Text>
        </View>
      ) : (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          accessibilityLabel={label}
          onError={() => setFailedUri(uri)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paper,
  },
  fallback: {
    backgroundColor: colors.mossSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    color: colors.moss,
    fontWeight: "700",
  },
});
