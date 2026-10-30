import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";

import { colors } from "@/theme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "quiet" | "danger";
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Button({ label, onPress, disabled = false, tone = "primary", style, testID }: Props) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        tone === "primary" ? styles.primary : tone === "danger" ? styles.danger : styles.quiet,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          tone === "primary" ? styles.primaryLabel : tone === "danger" ? styles.dangerLabel : styles.quietLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  primary: {
    backgroundColor: colors.cinnabar,
  },
  quiet: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.line,
  },
  danger: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.cinnabar,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.78,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryLabel: {
    color: colors.paperRaised,
  },
  quietLabel: {
    color: colors.ink,
  },
  dangerLabel: {
    color: colors.cinnabar,
  },
});
