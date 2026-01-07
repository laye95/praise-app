import { useState, useEffect, useRef } from "react";
import { Modal, TextInput, Keyboard, Animated, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as Haptics from "expo-haptics";

interface PositionModalProps {
  visible: boolean;
  memberName: string;
  currentPosition?: string;
  onClose: () => void;
  onSave: (position?: string) => void;
  isSaving?: boolean;
}

export function PositionModal({
  visible,
  memberName,
  currentPosition,
  onClose,
  onSave,
  isSaving = false,
}: PositionModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [position, setPosition] = useState(currentPosition || "");

  useEffect(() => {
    if (visible) {
      setPosition(currentPosition || "");
      slideAnim.setValue(500);
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
      slideAnim.setValue(500);
      fadeAnim.setValue(0);
    }
  }, [visible, currentPosition, slideAnim, fadeAnim]);

  const handleClose = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleSave = () => {
    if (isSaving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const trimmedPosition = position.trim();
    onSave(trimmedPosition || undefined);
  };

  const hasChanges = position.trim() !== (currentPosition || "");

  if (!visible) {
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
            maxHeight: "95%",
          }}
        >
          <Box
            className="rounded-t-3xl"
            style={{
              backgroundColor: theme.cardBg,
              borderTopWidth: 1,
              borderTopColor: theme.cardBorder,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <VStack className="gap-0">
              <Box className="items-center pt-4 pb-2">
                <Box
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: theme.textTertiary,
                    opacity: 0.5,
                  }}
                />
              </Box>

              <Box className="px-6 pt-4 pb-4">
                <HStack className="items-center justify-between mb-1">
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: theme.textPrimary }}
                  >
                    {t("teams.editPosition")}
                  </Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    activeOpacity={0.7}
                    disabled={isSaving}
                    className="cursor-pointer"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="close" size={20} color={theme.textPrimary} />
                  </TouchableOpacity>
                </HStack>

                <VStack className="gap-4 mt-6">
                  <VStack className="gap-2">
                    <Text
                      className="text-sm font-medium"
                      style={{ color: theme.textSecondary }}
                    >
                      {t("teams.calendar.member")}
                    </Text>
                    <Text
                      className="text-base"
                      style={{ color: theme.textPrimary }}
                    >
                      {memberName}
                    </Text>
                  </VStack>

                  <VStack className="gap-2">
                    <Text
                      className="text-sm font-medium"
                      style={{ color: theme.textSecondary }}
                    >
                      {t("teams.position")}
                    </Text>
                    <TextInput
                      placeholder={t("teams.positionPlaceholder")}
                      placeholderTextColor={theme.textTertiary}
                      value={position}
                      onChangeText={setPosition}
                      editable={!isSaving}
                      autoCapitalize="words"
                      style={{
                        backgroundColor: isDark ? "#1e293b" : "#ffffff",
                        borderWidth: 1,
                        borderColor: theme.cardBorder,
                        borderRadius: 12,
                        padding: 14,
                        color: theme.textPrimary,
                        fontSize: 16,
                      }}
                    />
                    <Text
                      className="text-xs"
                      style={{ color: theme.textTertiary }}
                    >
                      {t("teams.positionHint")}
                    </Text>
                  </VStack>
                </VStack>
              </Box>

              <Box
                className="border-t px-6 pt-4"
                style={{
                  borderTopWidth: 1,
                  borderTopColor: theme.cardBorder,
                  backgroundColor: theme.cardBg,
                  paddingBottom: Math.max(insets.bottom, 16),
                }}
              >
                <VStack className="gap-3">
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={!hasChanges || isSaving}
                    activeOpacity={0.8}
                    className="h-14 cursor-pointer rounded-2xl items-center justify-center"
                    style={{
                      backgroundColor:
                        hasChanges && !isSaving
                          ? theme.buttonPrimary
                          : theme.textTertiary,
                      shadowColor:
                        hasChanges && !isSaving
                          ? theme.buttonPrimary
                          : "transparent",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: hasChanges && !isSaving ? 0.3 : 0,
                      shadowRadius: 8,
                      elevation: hasChanges && !isSaving ? 4 : 0,
                    }}
                  >
                    {isSaving ? (
                      <HStack className="items-center gap-2">
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text
                          className="text-base font-semibold"
                          style={{ color: "#ffffff" }}
                        >
                          {t("teams.calendar.saving")}
                        </Text>
                      </HStack>
                    ) : (
                      <Text
                        className="text-base font-semibold"
                        style={{ color: "#ffffff" }}
                      >
                        {t("common.save")}
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={isSaving}
                    activeOpacity={0.7}
                    className="cursor-pointer"
                  >
                    <Text
                      className="py-3 text-center text-base font-semibold"
                      style={{ color: theme.textSecondary }}
                    >
                      {t("common.cancel")}
                    </Text>
                  </TouchableOpacity>
                </VStack>
              </Box>
            </VStack>
          </Box>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
