import { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import { DrawerWithLayout } from "@/components/ui/DrawerWithLayout";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { TeamCalendarEvent } from "@/types/teamCalendar";
import { Ionicons } from "@expo/vector-icons";
import { useBottomSheetModal } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";

interface DocumentFilterDrawerProps {
  visible: boolean;
  events: TeamCalendarEvent[];
  selectedEventId?: string;
  onClose: () => void;
  onApply: (eventId?: string) => void;
}

export function DocumentFilterDrawer({
  visible,
  events,
  selectedEventId,
  onClose,
  onApply,
}: DocumentFilterDrawerProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { dismiss } = useBottomSheetModal();
  const [localSelectedEventId, setLocalSelectedEventId] = useState<
    string | undefined
  >(selectedEventId);

  useEffect(() => {
    if (visible) setLocalSelectedEventId(selectedEventId);
  }, [visible, selectedEventId]);

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApply(localSelectedEventId);
    dismiss();
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalSelectedEventId(undefined);
  };

  const hasActiveFilters = localSelectedEventId !== undefined;

  return (
    <DrawerWithLayout
      visible={visible}
      onClose={onClose}
      title={t("teams.documents.filters")}
      subtitle={t("teams.documents.filterDescription")}
      snapPoints={["60%"]}
      content={
      <Box className="px-6">
        <VStack className="gap-5">
          <VStack
            className="gap-4 rounded-2xl p-4"
            style={{
              backgroundColor: isDark ? "#0f172a" : "#f8fafc",
              borderWidth: 1,
              borderColor: isDark ? "#1e293b" : "#e2e8f0",
            }}
          >
            <HStack className="items-center gap-3">
              <Box
                className="rounded-full p-2"
                style={{
                  backgroundColor: isDark ? "#1e3a5f" : "#dbeafe",
                }}
              >
                <Ionicons
                  name="calendar"
                  size={20}
                  color={theme.buttonPrimary}
                />
              </Box>
              <VStack className="flex-1">
                <Text
                  className="text-base font-bold"
                  style={{ color: theme.textPrimary }}
                >
                  {t("teams.documents.filterByEvent")}
                </Text>
                <Text
                  className="text-xs"
                  style={{ color: theme.textSecondary }}
                >
                  {t("teams.documents.filterByEventDescription")}
                </Text>
              </VStack>
            </HStack>

            <VStack className="gap-2">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setLocalSelectedEventId(undefined)}
                className="cursor-pointer"
                style={{
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: isDark ? "#1e293b" : "#ffffff",
                  borderWidth: 2,
                  borderColor:
                    localSelectedEventId === undefined
                      ? theme.buttonPrimary
                      : isDark
                        ? "#334155"
                        : "#cbd5e1",
                }}
              >
                <HStack className="items-center justify-between">
                  <HStack className="items-center gap-3">
                    <Box
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor:
                          localSelectedEventId === undefined
                            ? theme.buttonPrimary
                            : theme.textTertiary,
                        backgroundColor:
                          localSelectedEventId === undefined
                            ? theme.buttonPrimary
                            : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {localSelectedEventId === undefined && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color="#ffffff"
                        />
                      )}
                    </Box>
                    <VStack className="flex-1">
                      <Text
                        className="text-base font-semibold"
                        style={{ color: theme.textPrimary }}
                      >
                        {t("teams.documents.allDocuments")}
                      </Text>
                      <Text
                        className="text-xs"
                        style={{ color: theme.textSecondary }}
                      >
                        {t("teams.documents.showAllDocuments")}
                      </Text>
                    </VStack>
                  </HStack>
                </HStack>
              </TouchableOpacity>

              {events.map((event) => {
                const isSelected = localSelectedEventId === event.id;
                return (
                  <TouchableOpacity
                    key={event.id}
                    activeOpacity={0.7}
                    onPress={() => setLocalSelectedEventId(event.id)}
                    className="cursor-pointer"
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      backgroundColor: isDark ? "#1e293b" : "#ffffff",
                      borderWidth: 2,
                      borderColor: isSelected
                        ? theme.buttonPrimary
                        : isDark
                          ? "#334155"
                          : "#cbd5e1",
                    }}
                  >
                    <HStack className="items-center justify-between">
                      <HStack className="items-center gap-3 flex-1">
                        <Box
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: isSelected
                              ? theme.buttonPrimary
                              : theme.textTertiary,
                            backgroundColor: isSelected
                              ? theme.buttonPrimary
                              : "transparent",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isSelected && (
                            <Ionicons
                              name="checkmark"
                              size={14}
                              color="#ffffff"
                            />
                          )}
                        </Box>
                        <VStack className="flex-1">
                          <Text
                            className="text-base font-semibold"
                            style={{ color: theme.textPrimary }}
                          >
                            {event.title}
                          </Text>
                          <Text
                            className="text-xs"
                            style={{ color: theme.textSecondary }}
                          >
                            {new Date(event.date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </Text>
                        </VStack>
                      </HStack>
                    </HStack>
                  </TouchableOpacity>
                );
              })}
            </VStack>
          </VStack>
        </VStack>
      </Box>
      }
      saveButton={{
        label: t("common.apply"),
        onPress: handleApply,
      }}
      cancelButton={
        hasActiveFilters
          ? { label: t("common.reset"), onPress: handleReset }
          : undefined
      }
    />
  );
}
