import { useEffect, useRef } from "react";
import { Modal, TouchableOpacity, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { ChurchRole } from "@/services/api/permissionService";
import * as Haptics from "expo-haptics";

interface RoleActionSheetProps {
  visible: boolean;
  role: ChurchRole | null;
  onClose: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function RoleActionSheet({
  visible,
  role,
  onClose,
  onDelete,
  isDeleting = false,
}: RoleActionSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isDark = theme.pageBg === "#0f172a";
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(300);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(300);
      fadeAnim.setValue(0);
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete();
  };

  if (!visible || !role) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          opacity: fadeAnim,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{ flex: 1 }}
          onPress={handleClose}
        />
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Box
            className="rounded-t-3xl"
            style={{
              backgroundColor: theme.cardBg,
              borderTopWidth: 1,
              borderTopColor: theme.cardBorder,
              paddingTop: 8,
            }}
          >
              <VStack className="mb-4">
                <Box className="mb-3 items-center">
                  <Box
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: theme.textTertiary,
                      marginBottom: 16,
                    }}
                  />
                  <Text
                    className="mb-3 text-lg font-bold"
                    style={{ color: theme.textPrimary }}
                  >
                    {role.name}
                  </Text>
                </Box>
              </VStack>

              <VStack
                className="px-6 gap-3"
                style={{ paddingBottom: Math.max(insets.bottom, 16) }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleDelete}
                  disabled={isDeleting}
                  className="cursor-pointer rounded-xl"
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    backgroundColor: isDark ? "#7f1d1d" : "#fee2e2",
                    borderWidth: 1,
                    borderColor: isDark ? "#991b1b" : "#fecaca",
                    opacity: isDeleting ? 0.5 : 1,
                  }}
                >
                  <HStack className="items-center justify-center gap-3">
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color="#ffffff"
                    />
                    <Text
                      className="text-base font-semibold"
                      style={{ color: "#ffffff" }}
                    >
                      {isDeleting ? t("common.loading") : t("common.delete")}
                    </Text>
                  </HStack>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleClose}
                  className="cursor-pointer rounded-xl"
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    backgroundColor: isDark ? "#1e293b" : "#f3f4f6",
                  }}
                >
                  <Text
                    className="text-center text-base font-semibold"
                    style={{ color: theme.textPrimary }}
                  >
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>
              </VStack>
            </Box>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
