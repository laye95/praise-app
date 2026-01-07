import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MembershipRequestWithChurch } from "@/types/membership";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChurchApplication } from "../find-church/_hooks/useChurchApplication";

type StatusFilter = "all" | "pending" | "accepted" | "declined" | "cancelled";

export default function ApplicationsScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const {
    myRequests,
    isLoadingRequests,
    cancelRequest,
    cancellingRequestId,
    refetch,
  } = useChurchApplication();

  const handleRefresh = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
  }, [refetch]);

  const filteredRequests = myRequests.filter((req) => {
    if (statusFilter === "all") return true;
    return req.status === statusFilter;
  });

  const statusCounts = {
    all: myRequests.length,
    pending: myRequests.filter((r) => r.status === "pending").length,
    accepted: myRequests.filter((r) => r.status === "accepted").length,
    declined: myRequests.filter((r) => r.status === "declined").length,
    cancelled: myRequests.filter((r) => r.status === "cancelled").length,
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      all: t("applications.all"),
      pending: t("applications.pending"),
      accepted: t("applications.accepted"),
      declined: t("applications.declined"),
      cancelled: t("applications.cancelled"),
    };
    return labels[status] || status;
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        bgColor: theme.badgeInfo,
        iconColor: isDark ? "#ffffff" : "#2563eb",
        icon: "time",
        borderColor: theme.buttonPrimary,
      },
      accepted: {
        bgColor: theme.badgeSuccess,
        iconColor: theme.buttonAccept,
        icon: "checkmark-circle",
        borderColor: theme.buttonAccept,
      },
      declined: {
        bgColor: theme.badgeError,
        iconColor: theme.buttonDecline,
        icon: "close-circle",
        borderColor: theme.buttonDecline,
      },
      cancelled: {
        bgColor: theme.emptyBg,
        iconColor: theme.textTertiary,
        icon: "ban",
        borderColor: theme.cardBorder,
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const renderRequestCard = (request: MembershipRequestWithChurch) => {
    const config = getStatusConfig(request.status);
    const canCancel = request.status === "pending";
    const isCancelling = cancellingRequestId === request.id;

    return (
      <Box
        className="mb-4 rounded-2xl p-5"
        style={{
          backgroundColor: theme.cardBg,
          borderWidth: 1,
          borderColor: theme.cardBorder,
          borderLeftWidth: 4,
          borderLeftColor: config.borderColor,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <VStack className="gap-4">
          <HStack className="items-start justify-between">
            <HStack className="flex-1 items-center gap-3">
              <Box
                className="rounded-xl p-3"
                style={{
                  backgroundColor: theme.avatarPrimary,
                  minWidth: 48,
                  minHeight: 48,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="business"
                  size={24}
                  color={isDark ? "#ffffff" : theme.buttonPrimary}
                />
              </Box>
              <VStack className="flex-1 gap-0.5">
                <Text
                  className="text-lg font-bold"
                  style={{ color: theme.textPrimary }}
                >
                  {request.church?.name || "Unknown Church"}
                </Text>
                {request.church?.denomination && (
                  <Text
                    className="text-sm"
                    style={{ color: theme.textSecondary }}
                  >
                    {request.church.denomination}
                  </Text>
                )}
              </VStack>
            </HStack>
            <Box
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: config.bgColor }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: theme.textPrimary }}
              >
                {getStatusLabel(request.status)}
              </Text>
            </Box>
          </HStack>

          {request.church?.location && (
            <HStack className="items-center gap-2">
              <Ionicons
                name="location-outline"
                size={16}
                color={theme.textTertiary}
              />
              <Text className="text-sm" style={{ color: theme.textSecondary }}>
                {request.church.location}
              </Text>
            </HStack>
          )}

          {request.message && (
            <Box
              className="rounded-xl p-3"
              style={{
                backgroundColor: theme.emptyBg,
              }}
            >
              <Text
                className="mb-1 text-xs font-semibold"
                style={{ color: theme.textSecondary }}
              >
                {t("applications.yourMessage")}
              </Text>
              <Text className="text-sm" style={{ color: theme.textPrimary }}>
                {request.message}
              </Text>
            </Box>
          )}

          <Box
            className="rounded-lg border-l-4 px-3 py-2.5"
            style={{
              backgroundColor: theme.cardBg,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              borderLeftWidth: 4,
              borderLeftColor: config.borderColor,
            }}
          >
            <HStack className="items-center gap-2">
              <Box
                className="rounded-full p-1"
                style={{ backgroundColor: config.bgColor }}
              >
                <Ionicons
                  name={config.icon as any}
                  size={14}
                  color={config.iconColor}
                />
              </Box>
              <VStack className="flex-1 gap-0.5">
                <Text
                  className="text-xs font-semibold"
                  style={{ color: theme.textPrimary }}
                >
                  {request.status === "pending" && t("applications.pendingStatus")}
                  {request.status === "accepted" && t("applications.acceptedStatus")}
                  {request.status === "declined" && t("applications.declinedStatus")}
                  {request.status === "cancelled" && t("applications.cancelledStatus")}
                </Text>
                {request.status === "accepted" && (
                  <Text
                    className="text-xs"
                    style={{ color: theme.textSecondary }}
                  >
                    {t("applications.acceptedStatusSubtitle")}
                  </Text>
                )}
              </VStack>
            </HStack>
          </Box>

          {canCancel && (
            <Button
              onPress={() => cancelRequest(request.id)}
              variant="outline"
              size="lg"
              className="h-14 cursor-pointer rounded-2xl"
              isDisabled={isCancelling}
              style={{
                borderWidth: 1.5,
                borderColor: theme.buttonDecline,
                backgroundColor: theme.cardBg,
              }}
            >
              {isCancelling ? (
                <ButtonText
                  className="text-base font-semibold"
                  style={{ color: theme.buttonDecline }}
                >
                  {t("applications.cancelling")}
                </ButtonText>
              ) : (
                <ButtonText
                  className="text-base font-semibold"
                  style={{ color: theme.buttonDecline }}
                >
                  {t("applications.cancelApplication")}
                </ButtonText>
              )}
            </Button>
          )}
        </VStack>
      </Box>
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
      <VStack className="flex-1">
        <Box className="px-6 pb-4 pt-6">
          <VStack className="gap-2">
            <Text
              className="text-3xl font-bold"
              style={{ color: theme.textPrimary }}
            >
              {t("applications.title")}
            </Text>
            <Text className="text-base" style={{ color: theme.textSecondary }}>
              {t("applications.subtitle")}
            </Text>
          </VStack>
        </Box>

        {myRequests.length > 0 && (
          <Box className="mb-4 px-6">
            <HStack className="gap-2" style={{ flexWrap: "wrap" }}>
              {(
                [
                  "all",
                  "pending",
                  "accepted",
                  "declined",
                  "cancelled",
                ] as StatusFilter[]
              ).map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => setStatusFilter(status)}
                  activeOpacity={0.7}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor:
                      statusFilter === status
                        ? theme.tabActive
                        : theme.tabInactiveBg,
                    borderWidth: 1,
                    borderColor:
                      statusFilter === status
                        ? theme.tabActive
                        : theme.cardBorder,
                  }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{
                      color:
                        statusFilter === status
                          ? "#ffffff"
                          : theme.tabInactiveText,
                    }}
                  >
                    {getStatusLabel(status)} ({statusCounts[status]})
                  </Text>
                </TouchableOpacity>
              ))}
            </HStack>
          </Box>
        )}

        <Box className="flex-1 px-6">
          <FlatList
            data={filteredRequests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderRequestCard(item)}
            ListEmptyComponent={
              <Box className="items-center justify-center py-20">
                <Box
                  style={{
                    borderRadius: 999,
                    backgroundColor: theme.emptyBg,
                    padding: 24,
                    marginBottom: 16,
                  }}
                >
                  <Ionicons
                    name={
                      statusFilter === "all"
                        ? "mail-outline"
                        : "checkmark-done-outline"
                    }
                    size={48}
                    color={theme.textTertiary}
                  />
                </Box>
                <Text
                  className="mb-2 text-xl font-bold"
                  style={{ color: theme.textPrimary }}
                >
                  {statusFilter === "all"
                    ? t("applications.noApplicationsYet")
                    : t("applications.noApplicationsForStatus", {
                        status: getStatusLabel(statusFilter).toLowerCase(),
                      })}
                </Text>
                <Text
                  className="max-w-xs text-center text-sm"
                  style={{ color: theme.textSecondary }}
                >
                  {statusFilter === "all"
                    ? t("applications.startByFinding")
                    : t("applications.noApplicationsForStatusDescription", {
                        status: getStatusLabel(statusFilter).toLowerCase(),
                      })}
                </Text>
              </Box>
            }
            refreshControl={
              <RefreshControl
                refreshing={isLoadingRequests}
                onRefresh={handleRefresh}
                tintColor={theme.buttonPrimary}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListHeaderComponent={
              filteredRequests.length > 0 ? (
                <Box className="mb-2">
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: theme.textSecondary }}
                  >
                    {t("applications.applicationsFound", {
                      count: filteredRequests.length,
                      plural:
                        filteredRequests.length === 1
                          ? t("applications.application")
                          : t("applications.applicationsPlural"),
                    })}
                  </Text>
                </Box>
              ) : null
            }
          />
        </Box>
      </VStack>
    </SafeAreaView>
  );
}
