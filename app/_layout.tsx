import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LifeStoreProvider } from "@/state/store";
import { colors } from "@/theme";

export default function RootLayout() {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.paper);
  }, []);

  return (
    <SafeAreaProvider>
      <LifeStoreProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.paper },
          }}
        />
      </LifeStoreProvider>
    </SafeAreaProvider>
  );
}
