import "@/global.css";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { QueryProvider } from "@/providers/QueryProvider";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryProvider>
      <GluestackUIProvider mode={colorScheme ?? "dark"}>
        <ThemeProvider
          value={
            colorScheme === "dark" || !colorScheme ? DarkTheme : DefaultTheme
          }
        >
          <AuthProvider>
            <LanguageProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              />
              <StatusBar style="auto" />
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </GluestackUIProvider>
    </QueryProvider>
  );
}
