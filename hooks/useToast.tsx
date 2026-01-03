import { useToast as useGluestackToast } from "@/components/ui/toast";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useToast() {
  const toast = useGluestackToast();
  const insets = useSafeAreaInsets();

  const createToast = (
    title: string,
    description: string | undefined,
    backgroundColor: string,
    iconName: keyof typeof Ionicons.glyphMap,
    iconColor: string,
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
              backgroundColor,
              borderRadius: 16,
              padding: 16,
              minWidth: 300,
              maxWidth: 400,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
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
              <Ionicons name={iconName} size={24} color={iconColor} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 16,
                    fontWeight: "600",
                    lineHeight: 22,
                  }}
                >
                  {title}
                </Text>
                {description && (
                  <Text
                    style={{
                      color: "#f3f4f6",
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    {description}
                  </Text>
                )}
              </View>
              <View
                style={{
                  padding: 4,
                }}
                onTouchEnd={() => toast.close(toastId)}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color="rgba(255,255,255,0.8)"
                />
              </View>
            </View>
          </View>
        );
      },
    });
  };

  return {
    success: (title: string, description?: string) => {
      createToast(title, description, "#10b981", "checkmark-circle", "#ffffff");
    },
    error: (title: string, description?: string) => {
      createToast(title, description, "#dc2626", "close-circle", "#ffffff");
    },
    info: (title: string, description?: string) => {
      createToast(
        title,
        description,
        "#3b82f6",
        "information-circle",
        "#ffffff",
      );
    },
    warning: (title: string, description?: string) => {
      createToast(title, description, "#f59e0b", "warning", "#ffffff");
    },
    show: (options: {
      title: string;
      description?: string;
      action?: "error" | "warning" | "success" | "info";
    }) => {
      const configs = {
        success: { bg: "#10b981", icon: "checkmark-circle" as const },
        error: { bg: "#dc2626", icon: "close-circle" as const },
        warning: { bg: "#f59e0b", icon: "warning" as const },
        info: { bg: "#3b82f6", icon: "information-circle" as const },
      };
      const config = configs[options.action || "info"];
      createToast(
        options.title,
        options.description,
        config.bg,
        config.icon,
        "#ffffff",
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
