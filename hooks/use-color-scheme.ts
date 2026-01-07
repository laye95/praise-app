import { useThemePreference } from "@/contexts/ThemeContext";

export function useColorScheme(): "light" | "dark" {
  const { colorScheme } = useThemePreference();
  return colorScheme;
}
