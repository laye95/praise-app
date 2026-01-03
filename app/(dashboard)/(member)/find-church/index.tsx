import { useState, useCallback } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { TouchableOpacity, FlatList, RefreshControl, TextInput } from "react-native";
import { router } from "expo-router";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { useChurchApplication } from "./_hooks/useChurchApplication";
import { ChurchCard } from "./_components/ChurchCard";
import { ApplicationModal } from "./_components/ApplicationModal";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { Church } from "@/types/church";
import * as Haptics from "expo-haptics";

export default function FindChurchScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isDark = theme.pageBg === "#0f172a";
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  const {
    churches,
    myRequests,
    isLoadingChurches,
    isLoadingRequests,
    applyToChurch,
    cancelRequest,
    applyingChurchId,
    cancellingRequestId,
    refetch,
  } = useChurchApplication();

  const handleRefresh = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
  }, [refetch]);

  const hasPendingApplication = myRequests.some((req) => req.status === "pending");
  const activeApplicationChurchIds = new Set(
    myRequests
      .filter((req) => req.status === "pending" || req.status === "accepted")
      .map((req) => req.church_id),
  );

  const handleOpenModal = useCallback((church: Church) => {
    setSelectedChurch(church);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedChurch(null);
  }, []);

  const handleSubmitApplication = useCallback(
    (message: string) => {
      if (selectedChurch && !hasPendingApplication) {
        applyToChurch({ churchId: selectedChurch.id, message });
        handleCloseModal();
      }
    },
    [selectedChurch, hasPendingApplication, applyToChurch, handleCloseModal],
  );

  const filteredChurches = churches
    .filter((church) => {
      return !activeApplicationChurchIds.has(church.id);
    })
    .filter((church) => {
      const query = searchQuery.toLowerCase();
      return (
        church.name.toLowerCase().includes(query) ||
        church.denomination?.toLowerCase().includes(query) ||
        church.location?.toLowerCase().includes(query)
      );
    });

  const getRequestForChurch = (churchId: string) => {
    return myRequests.find((req) => req.church_id === churchId);
  };

  const pendingCount = myRequests.filter((req) => req.status === "pending").length;
  const acceptedCount = myRequests.filter((req) => req.status === "accepted").length;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
      <VStack className="flex-1">
        <Box className="px-6 pt-6 pb-4">
          <VStack className="gap-2 mb-4">
            <Text className="text-3xl font-bold" style={{ color: theme.textPrimary }}>
              {t("findChurch.title")}
            </Text>
            <Text className="text-base" style={{ color: theme.textSecondary }}>
              {t("findChurch.subtitle")}
            </Text>
          </VStack>

          {(pendingCount > 0 || acceptedCount > 0) && (
            <HStack className="gap-3 mb-4">
              {pendingCount > 0 && (
                <Box
                  className="flex-1 rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: isDark ? 0.2 : 0.04,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <HStack className="items-center gap-2">
                    <Box
                      className="rounded-full p-1.5"
                      style={{ backgroundColor: theme.badgeInfo }}
                    >
                      <Ionicons name="time" size={14} color="#ffffff" />
                    </Box>
                    <VStack className="flex-1">
                      <Text className="text-xs" style={{ color: theme.textSecondary }}>
                        {t("findChurch.pending")}
                      </Text>
                      <Text className="text-lg font-bold" style={{ color: theme.textPrimary }}>
                        {pendingCount}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              )}
              {acceptedCount > 0 && (
                <Box
                  className="flex-1 rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: isDark ? 0.2 : 0.04,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <HStack className="items-center gap-2">
                    <Box
                      className="rounded-full p-1.5"
                      style={{ backgroundColor: theme.badgeSuccess }}
                    >
                      <Ionicons name="checkmark-circle" size={14} color={theme.buttonAccept} />
                    </Box>
                    <VStack className="flex-1">
                      <Text className="text-xs" style={{ color: theme.textSecondary }}>
                        {t("findChurch.accepted")}
                      </Text>
                      <Text className="text-lg font-bold" style={{ color: theme.textPrimary }}>
                        {acceptedCount}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              )}
            </HStack>
          )}
        </Box>

        <Box className="px-6 mb-4">
          <Box
            className="rounded-xl"
            style={{
              backgroundColor: theme.cardBg,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.06,
              shadowRadius: 8,
              elevation: 3,
              borderWidth: 1,
              borderColor: theme.cardBorder,
            }}
          >
            <HStack className="items-center gap-3 px-4 py-3">
              <Ionicons name="search" size={20} color={theme.textTertiary} />
              <TextInput
                placeholder={t("findChurch.searchPlaceholder")}
                placeholderTextColor={theme.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: theme.textPrimary,
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  activeOpacity={0.7}
                  className="cursor-pointer"
                >
                  <Ionicons name="close-circle" size={20} color={theme.textTertiary} />
                </TouchableOpacity>
              )}
            </HStack>
          </Box>
        </Box>

        {pendingCount > 0 && (
          <Box className="px-6 mb-4">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/applications");
              }}
              activeOpacity={0.7}
              className="cursor-pointer"
            >
              <Box
                className="rounded-2xl border-l-4 p-5"
                style={{
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                  borderLeftWidth: 4,
                  borderLeftColor: theme.buttonPrimary,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <HStack className="items-center gap-3">
                  <Box
                    className="rounded-full p-2"
                    style={{ backgroundColor: theme.badgeInfo }}
                  >
                    <Ionicons name="time" size={18} color="#ffffff" />
                  </Box>
                  <VStack className="flex-1 gap-1">
                    <Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                      {t("findChurch.applicationsPending")}
                    </Text>
                    <Text className="text-xs" style={{ color: theme.textSecondary }}>
                      {t("findChurch.applicationsPendingDescription", {
                        count: pendingCount,
                        plural: pendingCount !== 1 ? "s" : "",
                      })}
                    </Text>
                  </VStack>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.textTertiary}
                  />
                </HStack>
              </Box>
            </TouchableOpacity>
          </Box>
        )}

        <Box className="flex-1 px-6">
          <FlatList
            data={filteredChurches}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChurchCard
                church={item}
                request={undefined}
                onApply={applyToChurch}
                onCancel={cancelRequest}
                isApplying={applyingChurchId === item.id}
                isCancelling={false}
                hasPendingApplication={hasPendingApplication}
                onOpenModal={handleOpenModal}
              />
            )}
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
                    name={searchQuery ? "search-outline" : "business-outline"}
                    size={48}
                    color={theme.textTertiary}
                  />
                </Box>
                <Text className="text-xl font-bold mb-2" style={{ color: theme.textPrimary }}>
                  {searchQuery
                    ? t("findChurch.noChurchesFound")
                    : activeApplicationChurchIds.size > 0 && churches.length === activeApplicationChurchIds.size
                      ? t("findChurch.allChurchesApplied")
                      : t("findChurch.noChurchesAvailable")}
                </Text>
                <Text className="text-sm text-center max-w-xs" style={{ color: theme.textSecondary }}>
                  {searchQuery
                    ? t("findChurch.tryAdjustingSearch")
                    : activeApplicationChurchIds.size > 0 && churches.length === activeApplicationChurchIds.size
                      ? t("findChurch.allChurchesAppliedDescription")
                      : t("findChurch.checkBackLater")}
                </Text>
              </Box>
            }
            refreshControl={
              <RefreshControl
                refreshing={isLoadingChurches || isLoadingRequests}
                onRefresh={handleRefresh}
                tintColor={theme.buttonPrimary}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
            ListHeaderComponent={
              filteredChurches.length > 0 ? (
                <Box className="mb-2">
                  <Text className="text-sm font-semibold" style={{ color: theme.textSecondary }}>
                    {t("findChurch.churchesFound", {
                      count: filteredChurches.length,
                      plural: filteredChurches.length === 1 ? t("findChurch.church") : t("findChurch.churches"),
                    })}
                  </Text>
                </Box>
              ) : null
            }
          />
        </Box>
      </VStack>

      <ApplicationModal
        visible={modalVisible}
        church={selectedChurch}
        onClose={handleCloseModal}
        onSubmit={handleSubmitApplication}
        isSubmitting={!!applyingChurchId}
      />
    </SafeAreaView>
  );
}
