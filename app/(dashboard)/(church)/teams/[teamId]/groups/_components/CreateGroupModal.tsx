import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  isCreating: boolean;
}

export function CreateGroupModal({
  visible,
  onClose,
  onCreate,
  isCreating,
}: CreateGroupModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [name, setName] = useState("");
  const nameInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
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
      ]).start(() => {
        nameInputRef.current?.focus();
      });
    } else {
      slideAnim.setValue(500);
      fadeAnim.setValue(0);
      setName("");
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
        toValue: 500,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setName("");
      onClose();
    });
  };

  const handleCreate = async () => {
    if (!name.trim() || isCreating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();
    await onCreate(name.trim());
    handleClose();
  };

  const canCreate = name.trim().length >= 2 && !isCreating;

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
                    {t("teams.groups.createGroup")}
                  </Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    activeOpacity={0.7}
                    disabled={isCreating}
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
                    <Ionicons
                      name="close"
                      size={20}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </HStack>
                <Text
                  className="text-sm mt-1"
                  style={{ color: theme.textSecondary }}
                >
                  {t("teams.groups.createGroupDescription")}
                </Text>
              </Box>

              <ScrollView
                showsVerticalScrollIndicator={false}
                className="px-6"
                style={{ maxHeight: 300 }}
                contentContainerStyle={{ paddingBottom: 16 }}
                keyboardShouldPersistTaps="handled"
              >
                <VStack className="gap-4">
                  <VStack className="gap-2">
                    <Text
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: theme.textSecondary }}
                    >
                      {t("teams.groups.groupName")}
                    </Text>
                    <Box
                      className="rounded-xl"
                      style={{
                        backgroundColor: isDark ? "#1e293b" : "#ffffff",
                        borderWidth: 1,
                        borderColor: isDark ? "#334155" : "#cbd5e1",
                      }}
                    >
                      <TextInput
                        ref={nameInputRef}
                        placeholder={t("teams.groups.groupNamePlaceholder")}
                        placeholderTextColor={theme.textTertiary}
                        value={name}
                        onChangeText={setName}
                        editable={!isCreating}
                        autoCapitalize="words"
                        returnKeyType="done"
                        onSubmitEditing={handleCreate}
                        style={{
                          color: theme.textPrimary,
                          fontSize: 16,
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                        }}
                      />
                    </Box>
                  </VStack>
                </VStack>
              </ScrollView>

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
                  <Button
                    onPress={handleCreate}
                    disabled={!canCreate}
                    action="primary"
                    variant="solid"
                    size="lg"
                    className="h-14 cursor-pointer rounded-2xl"
                    style={{
                      backgroundColor: canCreate
                        ? theme.buttonPrimary
                        : theme.textTertiary,
                      shadowColor: canCreate ? theme.buttonPrimary : "transparent",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: canCreate ? 0.3 : 0,
                      shadowRadius: 8,
                      elevation: canCreate ? 4 : 0,
                    }}
                  >
                    {isCreating ? (
                      <HStack className="items-center gap-2">
                        <ActivityIndicator size="small" color="#ffffff" />
                        <ButtonText
                          className="text-base font-semibold"
                          style={{ color: "#ffffff" }}
                        >
                          {t("teams.groups.creating")}
                        </ButtonText>
                      </HStack>
                    ) : (
                      <ButtonText
                        className="text-base font-semibold"
                        style={{ color: "#ffffff" }}
                      >
                        {t("teams.groups.createGroup")}
                      </ButtonText>
                    )}
                  </Button>
                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={isCreating}
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
