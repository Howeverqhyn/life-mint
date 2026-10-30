import { StyleSheet, Text, TextInput, View } from "react-native";

import { colors } from "@/theme";

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words";
  keyboardType?: "default" | "url";
  maxLength?: number;
  testID?: string;
};

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  multiline = false,
  autoCapitalize = "sentences",
  keyboardType = "default",
  maxLength,
  testID,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkMuted}
        style={[styles.input, multiline && styles.multiline]}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        autoCorrect={keyboardType !== "url"}
        keyboardType={keyboardType}
        maxLength={maxLength}
        selectionColor={colors.cinnabar}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paperRaised,
    color: colors.ink,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  hint: {
    color: colors.inkMuted,
    fontSize: 13,
    lineHeight: 19,
  },
});
