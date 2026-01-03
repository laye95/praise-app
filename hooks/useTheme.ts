import { useColorScheme } from "./use-color-scheme";

export interface ThemeColors {
  pageBg: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  buttonAccept: string;
  buttonDecline: string;
  buttonPrimary: string;
  tabActive: string;
  tabInactiveBg: string;
  tabInactiveText: string;
  avatarPrimary: string;
  avatarWarning: string;
  badgeSuccess: string;
  badgeError: string;
  badgeWarning: string;
  badgeInfo: string;
  emptyBg: string;
  messageBg: string;
}

const lightTheme: ThemeColors = {
  pageBg: "#fafafa",
  cardBg: "#ffffff",
  cardBorder: "#f3f4f6",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textTertiary: "#9ca3af",
  buttonAccept: "#10b981",
  buttonDecline: "#dc2626",
  buttonPrimary: "#6366f1",
  tabActive: "#6366f1",
  tabInactiveBg: "#f3f4f6",
  tabInactiveText: "#6b7280",
  avatarPrimary: "#eef2ff",
  avatarWarning: "#fef3c7",
  badgeSuccess: "#d1fae5",
  badgeError: "#fee2e2",
  badgeWarning: "#fef3c7",
  badgeInfo: "#eff6ff",
  emptyBg: "#f3f4f6",
  messageBg: "#f9fafb",
};

const darkTheme: ThemeColors = {
  pageBg: "#0f172a",
  cardBg: "#1e293b",
  cardBorder: "#334155",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textTertiary: "#64748b",
  buttonAccept: "#10b981",
  buttonDecline: "#f87171",
  buttonPrimary: "#1e40af",
  tabActive: "#1e40af",
  tabInactiveBg: "#1e293b",
  tabInactiveText: "#94a3b8",
  avatarPrimary: "#312e81",
  avatarWarning: "#78350f",
  badgeSuccess: "#064e3b",
  badgeError: "#7f1d1d",
  badgeWarning: "#78350f",
  badgeInfo: "#1e3a8a",
  emptyBg: "#1e293b",
  messageBg: "#0f172a",
};

export function useTheme(): ThemeColors {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? darkTheme : lightTheme;
}
