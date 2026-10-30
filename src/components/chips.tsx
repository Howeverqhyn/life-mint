import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme";

export function SuggestionChips({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option)}
            style={[styles.chip, selected && styles.chipOn]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextOn]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MultiChips({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = value.includes(option);
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() =>
              onChange(selected ? value.filter((item) => item !== option) : [...value, option])
            }
            style={[styles.chip, selected && styles.chipOn]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextOn]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipText: {
    color: colors.ink,
    fontSize: 14,
  },
  chipTextOn: {
    color: colors.paperRaised,
  },
});
