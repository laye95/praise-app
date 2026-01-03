import { useToast as useGluestackToast } from "@/components/ui/toast";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "./useTheme";

export function useToast() {
  const toast = useGluestackToast();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = theme.pageBg === "#0f172a";

  const createToast = (
    title: string,
    description: string | undefined,
    iconName: keyof typeof Ionicons.glyphMap,
    iconBgColor: string,
    iconColor: string,
    borderColor: string,
  ) => {
    const toastId = Date.now().toString();

    toast.show({
      id: toastId,
      placement: "bottom",
      duration: 3000,
      render: () => {
        return (
          <View
            style={{
              marginBottom: insets.bottom + 8,
              marginHorizontal: 16,
              marginTop: 4,
              backgroundColor: theme.cardBg,
              borderRadius: 16,
              padding: 16,
              minWidth: 300,
              maxWidth: 400,
              borderWidth: 1,
              borderColor: borderColor,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: iconBgColor,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={iconName} size={20} color={iconColor} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  style={{
                    color: theme.textPrimary,
                    fontSize: 15,
                    fontWeight: "600",
                    lineHeight: 20,
                  }}
                >
                  {title}
                </Text>
                {description && (
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: 13,
                      lineHeight: 18,
                    }}
                  >
                    {description}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toast.close(toastId)}
                style={{
                  padding: 4,
                }}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={theme.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>
        );
      },
    });
  };

  return {
    success: (title: string, description?: string) => {
      createToast(
        title,
        description,
        "checkmark-circle",
        theme.badgeSuccess,
        isDark ? "#10b981" : "#059669",
        isDark ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.2)",
      );
    },
    error: (title: string, description?: string) => {
      createToast(
        title,
        description,
        "close-circle",
        theme.badgeError,
        isDark ? "#ef4444" : "#dc2626",
        isDark ? "rgba(239, 68, 68, 0.3)" : "rgba(220, 38, 38, 0.2)",
      );
    },
    info: (title: string, description?: string) => {
      createToast(
        title,
        description,
        "information-circle",
        theme.badgeInfo,
        isDark ? "#60a5fa" : "#2563eb",
        isDark ? "rgba(96, 165, 250, 0.3)" : "rgba(37, 99, 235, 0.2)",
      );
    },
    warning: (title: string, description?: string) => {
      createToast(
        title,
        description,
        "warning",
        theme.badgeWarning,
        isDark ? "#fbbf24" : "#d97706",
        isDark ? "rgba(251, 191, 36, 0.3)" : "rgba(217, 119, 6, 0.2)",
      );
    },
    show: (options: {
      title: string;
      description?: string;
      action?: "error" | "warning" | "success" | "info";
    }) => {
      const configs = {
        success: {
          icon: "checkmark-circle" as const,
          iconBg: theme.badgeSuccess,
          iconColor: isDark ? "#10b981" : "#059669",
          borderColor: isDark ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.2)",
        },
        error: {
          icon: "close-circle" as const,
          iconBg: theme.badgeError,
          iconColor: isDark ? "#ef4444" : "#dc2626",
          borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "rgba(220, 38, 38, 0.2)",
        },
        warning: {
          icon: "warning" as const,
          iconBg: theme.badgeWarning,
          iconColor: isDark ? "#fbbf24" : "#d97706",
          borderColor: isDark ? "rgba(251, 191, 36, 0.3)" : "rgba(217, 119, 6, 0.2)",
        },
        info: {
          icon: "information-circle" as const,
          iconBg: theme.badgeInfo,
          iconColor: isDark ? "#60a5fa" : "#2563eb",
          borderColor: isDark ? "rgba(96, 165, 250, 0.3)" : "rgba(37, 99, 235, 0.2)",
        },
      };
      const config = configs[options.action || "info"];
      createToast(
        options.title,
        options.description,
        config.icon,
        config.iconBg,
        config.iconColor,
        config.borderColor,
      );
    },
    close: (id: string) => {
      toast.close(id);
    },
    closeAll: () => {
      toast.closeAll();
    },
  };
}
