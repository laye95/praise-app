import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  ScrollView,
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
import { TeamCalendarEvent } from "@/types/teamCalendar";
import { Ionicons } from "@expo/vector-icons";
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
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [localSelectedEventId, setLocalSelectedEventId] = useState<
    string | undefined
  >(selectedEventId);

  useEffect(() => {
    if (visible) {
      setLocalSelectedEventId(selectedEventId);
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
  }, [visible, selectedEventId, slideAnim, fadeAnim]);

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
      onClose();
    });
  };

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApply(localSelectedEventId);
    handleClose();
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalSelectedEventId(undefined);
  };

  const hasActiveFilters = localSelectedEventId !== undefined;

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
            maxHeight: "85%",
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
                    {t("teams.documents.filters")}
                  </Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    activeOpacity={0.7}
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
                  {t("teams.documents.filterDescription")}
                </Text>
              </Box>

              <ScrollView
                showsVerticalScrollIndicator={false}
                className="px-6"
                style={{ maxHeight: 400 }}
                contentContainerStyle={{ paddingBottom: 0 }}
              >
                <VStack className="gap-5">
                  <VStack className="gap-4 rounded-2xl p-4" style={{
                    backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                    borderWidth: 1,
                    borderColor: isDark ? "#1e293b" : "#e2e8f0",
                  }}>
                    <HStack className="items-center gap-3">
                      <Box className="rounded-full p-2" style={{
                        backgroundColor: isDark ? "#1e3a5f" : "#dbeafe",
                      }}>
                        <Ionicons name="calendar" size={20} color={theme.buttonPrimary} />
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
                                <Ionicons name="checkmark" size={14} color="#ffffff" />
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
                                    <Ionicons name="checkmark" size={14} color="#ffffff" />
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
                  {hasActiveFilters && (
                    <TouchableOpacity
                      onPress={handleReset}
                      activeOpacity={0.7}
                      className="cursor-pointer"
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor: isDark ? "#1e293b" : "#f8fafc",
                        borderWidth: 1,
                        borderColor: theme.cardBorder,
                      }}
                    >
                      <Text
                        className="text-center text-base font-semibold"
                        style={{ color: theme.textSecondary }}
                      >
                        {t("common.reset")}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <Button
                    onPress={handleApply}
                    action="primary"
                    variant="solid"
                    size="lg"
                    className="h-14 cursor-pointer rounded-2xl"
                    style={{
                      backgroundColor: theme.buttonPrimary,
                      shadowColor: theme.buttonPrimary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <ButtonText
                      className="text-base font-semibold"
                      style={{ color: "#ffffff" }}
                    >
                      {t("common.apply")}
                    </ButtonText>
                  </Button>
                </VStack>
              </Box>
            </VStack>
          </Box>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
