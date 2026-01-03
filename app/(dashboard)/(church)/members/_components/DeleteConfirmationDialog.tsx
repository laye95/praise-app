import { useEffect, useRef } from "react";
import { Modal, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import * as Haptics from "expo-haptics";

interface DeleteConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  memberName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmationDialog({
  visible,
  title,
  message,
  memberName,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteConfirmationDialogProps) {
  const theme = useTheme();
  const isDark = theme.pageBg === "#0f172a";
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 300,
          friction: 30,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible, scaleAnim, fadeAnim]);

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  if (!visible) {
    return null;
  }

  const scale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleCancel}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          opacity: fadeAnim,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onPress={handleCancel}
        />
        <Animated.View
          style={{
            transform: [{ scale }],
            width: "100%",
            maxWidth: 400,
          }}
        >
          <Box
            className="rounded-2xl"
            style={{
              backgroundColor: theme.cardBg,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDark ? 0.5 : 0.15,
              shadowRadius: 16,
              elevation: 8,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              overflow: "hidden",
            }}
          >
            <VStack className="p-6">
              <Box className="items-center mb-4">
                <Box
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    backgroundColor: isDark ? "#7f1d1d" : "#fef2f2",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Ionicons
                    name="alert-circle"
                    size={32}
                    color={isDark ? "#fca5a5" : "#dc2626"}
                  />
                </Box>
                <Text
                  className="text-xl font-bold mb-2"
                  style={{ color: theme.textPrimary }}
                >
                  {title}
                </Text>
                <Text
                  className="text-sm text-center"
                  style={{ color: theme.textSecondary }}
                >
                  {message}
                </Text>
                {memberName && (
                  <Box
                    className="mt-3 px-4 py-2 rounded-lg"
                    style={{
                      backgroundColor: isDark ? "#1e293b" : "#f3f4f6",
                    }}
                  >
                    <Text
                      className="text-base font-semibold"
                      style={{ color: theme.textPrimary }}
                    >
                      {memberName}
                    </Text>
                  </Box>
                )}
              </Box>

              <VStack className="gap-3">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleConfirm}
                  disabled={isDeleting}
                  className="cursor-pointer"
                  style={{
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: isDark ? "#7f1d1d" : "#dc2626",
                    opacity: isDeleting ? 0.5 : 1,
                  }}
                >
                  <Text
                    className="text-base font-semibold text-center"
                    style={{ color: "#ffffff" }}
                  >
                    {isDeleting ? "Removing..." : "Remove Member"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleCancel}
                  disabled={isDeleting}
                  className="cursor-pointer"
                  style={{
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: theme.cardBg,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                    opacity: isDeleting ? 0.5 : 1,
                  }}
                >
                  <Text
                    className="text-base font-semibold text-center"
                    style={{ color: theme.textPrimary }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </VStack>
            </VStack>
          </Box>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
