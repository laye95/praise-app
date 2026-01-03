import { useState, useEffect } from "react";
import { ScrollView, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/api/userService";
import { queryKeys } from "@/services/queryKeys";
import { useToast } from "@/hooks/useToast";
import * as Haptics from "expo-haptics";
import { AppError } from "@/services/api/baseService";
import { useTranslation } from "@/hooks/useTranslation";

export default function GeneralProfileScreen() {
  const theme = useTheme();
  const isDark = theme.pageBg === "#0f172a";
  const { user, session } = useAuth();
  const userId = user?.id || session?.user?.id;
  const { data: profile, isLoading } = useUserProfile(userId);
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (data: { full_name?: string }) => {
      if (!userId) throw new Error("No user ID");
      return userService.updateUserProfile(userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(userId || ""),
      });
      if (profile?.church_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.users.byChurch(profile.church_id),
        });
      }
      toast.show({
        title: t("profile.updateSuccess"),
        description: t("profile.updateSuccessDescription"),
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = t("profile.updateFailed");
      if (err instanceof AppError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.show({
        title: t("common.error"),
        description: errorMessage,
        action: "error",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const handleSave = () => {
    if (!fullName.trim()) {
      toast.show({
        title: t("profile.validationError"),
        description: t("profile.fullNameRequired"),
        action: "error",
      });
      return;
    }

    const updateData: { full_name?: string } = {
      full_name: fullName.trim() || undefined,
    };

    updateMutation.mutate(updateData);
  };

  const hasChanges =
    profile &&
    fullName !== (profile.full_name || "");

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
        <Box className="flex-1 items-center justify-center">
          <Text style={{ color: theme.textSecondary }}>{t("profile.loading")}</Text>
        </Box>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
        <Box className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle" size={48} color={theme.badgeError} />
          <Text className="mt-4 text-center" style={{ color: theme.textPrimary }}>
            {t("profile.loadFailed")}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 cursor-pointer"
            style={{
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 12,
              backgroundColor: theme.buttonPrimary,
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "600" }}>{t("common.goBack")}</Text>
          </TouchableOpacity>
        </Box>
      </SafeAreaView>
    );
  }

  const FormField = ({
    label,
    placeholder,
    value,
    onChangeText,
    icon,
    required = false,
    helperText,
    editable = true,
  }: {
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    icon: string;
    required?: boolean;
    helperText?: string;
    editable?: boolean;
  }) => (
    <VStack className="gap-2">
      <HStack className="items-center gap-2">
        <Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
          {label}
        </Text>
        {required && (
          <Text style={{ color: theme.badgeError, fontSize: 14 }}>*</Text>
        )}
      </HStack>
      {helperText && (
        <Text className="text-xs" style={{ color: theme.textTertiary, marginTop: -4 }}>
          {helperText}
        </Text>
      )}
      <HStack
        className="items-center rounded-xl px-4 py-3.5"
        style={{
          backgroundColor: editable ? theme.pageBg : theme.cardBg,
          borderWidth: 1.5,
          borderColor: theme.cardBorder,
          opacity: editable ? 1 : 0.6,
        }}
      >
        <Ionicons name={icon as any} size={20} color={theme.textTertiary} style={{ marginRight: 12 }} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={theme.textTertiary}
          value={value}
          onChangeText={onChangeText}
          editable={editable && !updateMutation.isPending}
          style={{
            flex: 1,
            fontSize: 15,
            color: theme.textPrimary,
            padding: 0,
          }}
        />
      </HStack>
    </VStack>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box className="px-6 py-6">
          <HStack className="items-center mb-8">
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              className="mr-4 cursor-pointer"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.cardBg,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }}
            >
              <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
            <VStack className="flex-1">
              <Text className="text-3xl font-bold" style={{ color: theme.textPrimary }}>
                {t("profile.generalInformation")}
              </Text>
              <Text className="text-sm mt-1" style={{ color: theme.textSecondary }}>
                {t("profile.generalInformationSubtitle")}
              </Text>
            </VStack>
          </HStack>

          <VStack className="gap-6">
            <Box
              className="rounded-2xl p-6"
              style={{
                backgroundColor: theme.cardBg,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.3 : 0.08,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <VStack className="gap-6">
                <FormField
                  label={t("profile.fullName")}
                  placeholder={t("profile.fullNamePlaceholder")}
                  value={fullName}
                  onChangeText={setFullName}
                  icon="person"
                  required
                />

                <FormField
                  label={t("profile.email")}
                  placeholder={t("profile.emailPlaceholder")}
                  value={email}
                  onChangeText={setEmail}
                  icon="mail"
                  helperText={t("profile.emailCannotChange")}
                  editable={false}
                />
              </VStack>
            </Box>

            <TouchableOpacity
              onPress={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
              activeOpacity={0.8}
              className="cursor-pointer"
              style={{
                paddingVertical: 16,
                borderRadius: 14,
                backgroundColor: hasChanges && !updateMutation.isPending
                  ? theme.buttonPrimary
                  : theme.cardBorder,
                shadowColor: hasChanges && !updateMutation.isPending ? theme.buttonPrimary : "transparent",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: hasChanges && !updateMutation.isPending ? 4 : 0,
              }}
            >
              <HStack className="items-center justify-center gap-2">
                {updateMutation.isPending ? (
                  <>
                    <Ionicons name="hourglass" size={18} color="#ffffff" />
                    <Text
                      className="text-base font-semibold"
                      style={{ color: "#ffffff" }}
                    >
                      {t("profile.saving")}
                    </Text>
                  </>
                ) : hasChanges ? (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                    <Text
                      className="text-base font-semibold"
                      style={{ color: "#ffffff" }}
                    >
                      {t("profile.saveChanges")}
                    </Text>
                  </>
                ) : (
                  <Text
                    className="text-base font-semibold"
                    style={{ color: theme.textSecondary }}
                  >
                    {t("profile.noChanges")}
                  </Text>
                )}
              </HStack>
            </TouchableOpacity>
          </VStack>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
