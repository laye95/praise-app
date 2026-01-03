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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { churchService } from "@/services/api/churchService";
import { queryKeys } from "@/services/queryKeys";
import { UpdateChurchData } from "@/types/church";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import * as Haptics from "expo-haptics";
import { AppError } from "@/services/api/baseService";

export default function GeneralInfoScreen() {
  const theme = useTheme();
  const isDark = theme.pageBg === "#0f172a";
  const { t } = useTranslation();
  const { user, session } = useAuth();
  const userId = user?.id || session?.user?.id;
  const { data: profile } = useUserProfile(userId);
  const queryClient = useQueryClient();
  const toast = useToast();

  const [churchName, setChurchName] = useState("");
  const [denomination, setDenomination] = useState("");
  const [location, setLocation] = useState("");
  const [timezone, setTimezone] = useState("UTC");

  const churchQuery = useQuery({
    queryKey: queryKeys.churches.detail(profile?.church_id || ""),
    queryFn: () => churchService.getChurch(profile!.church_id!),
    enabled: !!profile?.church_id,
  });

  useEffect(() => {
    if (churchQuery.data) {
      setChurchName(churchQuery.data.name || "");
      setDenomination(churchQuery.data.denomination || "");
      setLocation(churchQuery.data.location || "");
      setTimezone(churchQuery.data.timezone || "UTC");
    }
  }, [churchQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateChurchData) => {
      if (!profile?.church_id) throw new Error("No church ID");
      return churchService.updateChurch(profile.church_id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.churches.detail(profile?.church_id || ""),
      });
      toast.show({
        title: "Church Updated",
        description: "Church information has been updated successfully",
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = "Failed to update church information";
      if (err instanceof AppError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.show({
        title: "Error",
        description: errorMessage,
        action: "error",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const handleSave = () => {
    if (!churchName.trim()) {
      toast.show({
        title: "Validation Error",
        description: "Church name is required",
        action: "error",
      });
      return;
    }

    const updateData: UpdateChurchData = {
      name: churchName.trim(),
      denomination: denomination.trim() || undefined,
      location: location.trim() || undefined,
      timezone: timezone.trim() || "UTC",
    };

    updateMutation.mutate(updateData);
  };

  const hasChanges =
    churchQuery.data &&
    (churchName !== (churchQuery.data.name || "") ||
      denomination !== (churchQuery.data.denomination || "") ||
      location !== (churchQuery.data.location || "") ||
      timezone !== (churchQuery.data.timezone || "UTC"));

  if (churchQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
        <Box className="flex-1 items-center justify-center">
          <Text style={{ color: theme.textSecondary }}>Loading church information...</Text>
        </Box>
      </SafeAreaView>
    );
  }

  if (churchQuery.isError || !churchQuery.data) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
        <Box className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle" size={48} color={theme.badgeError} />
          <Text className="mt-4 text-center" style={{ color: theme.textPrimary }}>
            Failed to load church information
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
            <Text style={{ color: "#ffffff", fontWeight: "600" }}>Go Back</Text>
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
  }: {
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    icon: string;
    required?: boolean;
    helperText?: string;
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
          backgroundColor: theme.pageBg,
          borderWidth: 1.5,
          borderColor: theme.cardBorder,
        }}
      >
        <Ionicons name={icon as any} size={20} color={theme.textTertiary} style={{ marginRight: 12 }} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={theme.textTertiary}
          value={value}
          onChangeText={onChangeText}
          style={{
            flex: 1,
            fontSize: 15,
            color: theme.textPrimary,
            padding: 0,
          }}
          editable={!updateMutation.isPending}
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
                {t("generalInfo.title")}
              </Text>
              <Text className="text-sm mt-1" style={{ color: theme.textSecondary }}>
                {t("generalInfo.subtitle")}
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
                  label={t("generalInfo.churchName")}
                  placeholder={t("generalInfo.churchNamePlaceholder")}
                  value={churchName}
                  onChangeText={setChurchName}
                  icon="business"
                  required
                />

                <FormField
                  label={t("generalInfo.denomination")}
                  placeholder={t("generalInfo.denominationPlaceholder")}
                  value={denomination}
                  onChangeText={setDenomination}
                  icon="book"
                  helperText={t("generalInfo.denominationHelper")}
                />

                <FormField
                  label={t("generalInfo.location")}
                  placeholder={t("generalInfo.locationPlaceholder")}
                  value={location}
                  onChangeText={setLocation}
                  icon="location"
                  helperText={t("generalInfo.locationHelper")}
                />

                <FormField
                  label={t("generalInfo.timezone")}
                  placeholder={t("generalInfo.timezonePlaceholder")}
                  value={timezone}
                  onChangeText={setTimezone}
                  icon="time"
                  helperText={t("generalInfo.timezoneHelper")}
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
                      {t("generalInfo.saving")}
                    </Text>
                  </>
                ) : hasChanges ? (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                    <Text
                      className="text-base font-semibold"
                      style={{ color: "#ffffff" }}
                    >
                      {t("generalInfo.saveChanges")}
                    </Text>
                  </>
                ) : (
                  <Text
                    className="text-base font-semibold"
                    style={{ color: theme.textSecondary }}
                  >
                    {t("generalInfo.noChanges")}
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
