import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { UpdateTeamData } from "@/types/team";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
import { SafeAreaView } from "react-native-safe-area-context";

interface EditTeamModalProps {
  visible: boolean;
  teamName: string;
  teamDescription?: string;
  onClose: () => void;
  onSave: (data: UpdateTeamData) => Promise<void>;
  isSaving: boolean;
}

export function EditTeamModal({
  visible,
  teamName,
  teamDescription,
  onClose,
  onSave,
  isSaving,
}: EditTeamModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.pageBg === "#0f172a";
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [name, setName] = useState(teamName);
  const [description, setDescription] = useState(teamDescription || "");
  const nameInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setName(teamName);
      setDescription(teamDescription || "");
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
  }, [visible, teamName, teamDescription, slideAnim, fadeAnim]);

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
      setName(teamName);
      setDescription(teamDescription || "");
      onClose();
    });
  };

  const handleSave = async () => {
    if (!name.trim() || isSaving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();
    await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
    });
    handleClose();
  };

  const canSave =
    name.trim().length >= 2 &&
    (name.trim() !== teamName ||
      description.trim() !== (teamDescription || "")) &&
    !isSaving;

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
            maxHeight: "98%",
          }}
        >
          <SafeAreaView edges={["bottom"]}>
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
              <VStack className="gap-0" style={{ flex: 1 }}>
                <Box className="items-center pb-2 pt-4">
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

                <Box className="px-6 pb-4 pt-4">
                  <HStack className="mb-1 items-center justify-between">
                    <Text
                      className="text-2xl font-bold"
                      style={{ color: theme.textPrimary }}
                    >
                      {t("teams.editTeam")}
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
                      <Ionicons
                        name="close"
                        size={20}
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>
                  </HStack>
                  <Text
                    className="mt-1 text-sm"
                    style={{ color: theme.textSecondary }}
                  >
                    {t("teams.editTeamDescription")}
                  </Text>
                </Box>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  className="px-6"
                  style={{ flex: 1 }}
                  keyboardShouldPersistTaps="handled"
                >
                  <VStack className="gap-6 pb-4">
                    <VStack className="gap-3">
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: theme.textPrimary }}
                      >
                        {t("teams.teamName")}
                      </Text>
                      <Box
                        className="rounded-xl"
                        style={{
                          backgroundColor: isDark ? "#1e293b" : "#ffffff",
                          borderWidth: 1,
                          borderColor: isDark ? "#334155" : "#e2e8f0",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: isDark ? 0.2 : 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }}
                      >
                        <TextInput
                          ref={nameInputRef}
                          placeholder={t("teams.teamNamePlaceholder")}
                          placeholderTextColor={theme.textTertiary}
                          value={name}
                          onChangeText={setName}
                          autoCapitalize="words"
                          returnKeyType="next"
                          editable={!isSaving}
                          onSubmitEditing={() =>
                            descriptionInputRef.current?.focus()
                          }
                          style={{
                            color: theme.textPrimary,
                            fontSize: 16,
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                          }}
                        />
                      </Box>
                    </VStack>

                    <VStack className="gap-3">
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: theme.textPrimary }}
                      >
                        {t("teams.description")}
                        <Text
                          className="text-xs font-normal"
                          style={{ color: theme.textSecondary }}
                        >
                          {" "}
                          ({t("common.optional")})
                        </Text>
                      </Text>
                      <Box
                        className="rounded-xl"
                        style={{
                          backgroundColor: isDark ? "#1e293b" : "#ffffff",
                          borderWidth: 1,
                          borderColor: isDark ? "#334155" : "#e2e8f0",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: isDark ? 0.2 : 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }}
                      >
                        <TextInput
                          ref={descriptionInputRef}
                          placeholder={t("teams.descriptionPlaceholder")}
                          placeholderTextColor={theme.textTertiary}
                          value={description}
                          onChangeText={setDescription}
                          multiline
                          numberOfLines={3}
                          editable={!isSaving}
                          textAlignVertical="top"
                          style={{
                            color: theme.textPrimary,
                            fontSize: 16,
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            minHeight: 90,
                            lineHeight: 22,
                          }}
                        />
                      </Box>
                    </VStack>
                  </VStack>
                </ScrollView>

                <Box
                  className="border-t px-6 pb-6 pt-4"
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: theme.cardBorder,
                    backgroundColor: theme.cardBg,
                  }}
                >
                  <VStack className="gap-3">
                    <Button
                      onPress={handleSave}
                      disabled={!canSave}
                      action="primary"
                      variant="solid"
                      size="lg"
                      className="h-14 cursor-pointer rounded-2xl"
                      style={{
                        backgroundColor: canSave
                          ? theme.buttonPrimary
                          : theme.textTertiary,
                        shadowColor: canSave
                          ? theme.buttonPrimary
                          : "transparent",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: canSave ? 0.3 : 0,
                        shadowRadius: 8,
                        elevation: canSave ? 4 : 0,
                      }}
                    >
                      {isSaving ? (
                        <HStack className="items-center gap-2">
                          <ActivityIndicator size="small" color="#ffffff" />
                          <ButtonText
                            className="text-base font-semibold"
                            style={{ color: "#ffffff" }}
                          >
                            {t("teams.saving")}
                          </ButtonText>
                        </HStack>
                      ) : (
                        <ButtonText
                          className="text-base font-semibold"
                          style={{ color: "#ffffff" }}
                        >
                          {t("common.save")}
                        </ButtonText>
                      )}
                    </Button>
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
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
