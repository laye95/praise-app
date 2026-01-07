import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { usePermissions } from "@/hooks/usePermissions";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTeam } from "../../_hooks/useTeam";
import { CalendarEventModal } from "./_components/CalendarEventModal";
import { useTeamCalendar } from "./_hooks/useTeamCalendar";

type ViewType = "month" | "week";

export default function CalendarScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { can, hasRole } = usePermissions();
  const { team, members: teamMembers, isLeader } = useTeam(teamId);

  const formatTime = (timeString: string | undefined): string => {
    if (!timeString) return "";
    return timeString.split(":").slice(0, 2).join(":");
  };

  const teamUsers = teamMembers
    .map((tm) => tm.user)
    .filter((u): u is NonNullable<typeof u> => u !== null);
  const {
    events,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    isCreating,
    isUpdating,
    isDeleting,
  } = useTeamCalendar(teamId);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>("month");

  const isPastor = hasRole("Pastor");
  const canManageCalendar = isPastor || isLeader;

  const monthGridData = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      dateString: string;
      events: typeof events;
    }> = [];

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateString = formatDateLocal(currentDate);
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.toDateString() === new Date().toDateString();
      const dayEvents = events.filter((e) => e.date === dateString);

      days.push({
        date: currentDate,
        isCurrentMonth,
        isToday,
        dateString,
        events: dayEvents,
      });
    }

    return days;
  }, [events, selectedMonth]);

  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const currentMonthEvents = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const startDate = formatDateLocal(new Date(year, month, 1));
    const endDate = formatDateLocal(new Date(year, month + 1, 0));

    const filtered = events.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate >= new Date(startDate) && eventDate <= new Date(endDate);
    });

    const grouped = filtered.reduce(
      (acc, event) => {
        const dateKey = event.date;
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(event);
        return acc;
      },
      {} as Record<string, typeof filtered>,
    );

    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, events]) => ({ date, events }));
  }, [events, selectedMonth]);

  const handleGoToToday = () => {
    setSelectedMonth(new Date());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCreateEvent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEventId(null);
    setShowEventModal(true);
  };

  const handleEditEvent = (eventId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEventId(eventId);
    setShowEventModal(true);
  };

  const handleSaveEvent = async (data: any) => {
    if (selectedEventId) {
      await updateEvent({ eventId: selectedEventId, data });
    } else {
      await createEvent(data);
    }
    setShowEventModal(false);
    setSelectedEventId(null);
  };

  const handleDeleteEvent = async (eventId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteEvent(eventId);
  };

  const selectedEvent = selectedEventId
    ? events.find((e) => e.id === selectedEventId)
    : null;

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(selectedMonth);
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setSelectedMonth(newMonth);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const monthName = selectedMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const calendarMaxHeight = useMemo(() => {
    const headerHeight = 60;
    const monthNavHeight = 60;
    const tabBarHeight = 70;
    const padding = 0;
    return (
      windowHeight -
      insets.top -
      insets.bottom -
      headerHeight -
      monthNavHeight -
      tabBarHeight -
      padding
    );
  }, [windowHeight, insets.top, insets.bottom]);

  const scrollViewMaxHeight = useMemo(() => {
    const monthNavHeight = 60;
    return calendarMaxHeight - monthNavHeight - 16;
  }, [calendarMaxHeight]);

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: theme.pageBg }}
      >
        <Box className="items-center justify-center py-20">
          <Text className="text-base" style={{ color: theme.textSecondary }}>
            {t("teams.calendar.loading")}
          </Text>
        </Box>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{
        backgroundColor: theme.pageBg,
        paddingBottom: insets.bottom,
      }}
      edges={["top", "left", "right"]}
    >
      <VStack className="flex-1 px-6 py-4">
        <HStack className="mb-2 items-center justify-between">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="cursor-pointer"
          >
            <HStack className="items-center gap-2">
              <Ionicons
                name="chevron-back"
                size={24}
                color={theme.textPrimary}
              />
              <Text
                className="text-lg font-semibold"
                style={{ color: theme.textPrimary }}
              >
                {t("common.back")}
              </Text>
            </HStack>
          </TouchableOpacity>
          <HStack className="items-center gap-2">
            <TouchableOpacity
              onPress={() => setViewType("month")}
              activeOpacity={0.7}
              className="cursor-pointer"
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor:
                  viewType === "month" ? theme.buttonPrimary : "transparent",
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{
                  color: viewType === "month" ? "#ffffff" : theme.textSecondary,
                }}
              >
                {t("teams.calendar.monthView")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewType("week")}
              activeOpacity={0.7}
              className="cursor-pointer"
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor:
                  viewType === "week" ? theme.buttonPrimary : "transparent",
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{
                  color: viewType === "week" ? "#ffffff" : theme.textSecondary,
                }}
              >
                {t("teams.calendar.weekView")}
              </Text>
            </TouchableOpacity>
            {canManageCalendar && (
              <TouchableOpacity
                onPress={handleCreateEvent}
                activeOpacity={0.7}
                className="cursor-pointer"
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: theme.buttonPrimary,
                  marginLeft: 8,
                }}
              >
                <Ionicons name="add" size={18} color="#ffffff" />
              </TouchableOpacity>
            )}
          </HStack>
        </HStack>

        <Box style={{ height: 12 }} />

        <Box
          className="rounded-2xl p-4"
          style={{
            backgroundColor: isDark ? "#1a2332" : "#f8fafc",
            borderWidth: 1,
            borderColor: theme.cardBorder,
            maxHeight: calendarMaxHeight,
          }}
        >
          <HStack className="mb-4 items-center justify-between">
            <TouchableOpacity
              onPress={() => navigateMonth("prev")}
              activeOpacity={0.7}
              className="cursor-pointer"
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={theme.textPrimary}
              />
            </TouchableOpacity>
            <Text
              className="text-lg font-bold"
              style={{ color: theme.textPrimary }}
            >
              {monthName}
            </Text>
            <TouchableOpacity
              onPress={() => navigateMonth("next")}
              activeOpacity={0.7}
              className="cursor-pointer"
            >
              <Ionicons
                name="chevron-forward"
                size={24}
                color={theme.textPrimary}
              />
            </TouchableOpacity>
          </HStack>

          {viewType === "month" ? (
            <VStack className="gap-1">
              <HStack className="mb-1 items-center justify-between">
                {["M", "D", "W", "D", "V", "Z", "Z"].map((day, index) => (
                  <Box key={index} className="flex-1 items-center">
                    <Text
                      className="text-[10px] font-semibold"
                      style={{ color: theme.textTertiary }}
                    >
                      {day}
                    </Text>
                  </Box>
                ))}
              </HStack>
              <VStack className="gap-0.5">
                {Array.from({ length: 6 }).map((_, weekIndex) => (
                  <HStack key={weekIndex} className="gap-0.5">
                    {monthGridData
                      .slice(weekIndex * 7, (weekIndex + 1) * 7)
                      .map((day, dayIndex) => {
                        const getEventColor = (index: number) => {
                          const colors = [
                            "#3b82f6",
                            "#10b981",
                            "#f59e0b",
                            "#ef4444",
                            "#8b5cf6",
                            "#ec4899",
                          ];
                          return colors[index % colors.length];
                        };
                        const visibleEvents = day.events.slice(0, 2);
                        const remainingCount = day.events.length - 2;

                        return (
                          <Box
                            key={dayIndex}
                            className="flex-1"
                            style={{
                              minHeight: 60,
                              padding: 3,
                              borderRadius: 6,
                              backgroundColor: day.isToday
                                ? isDark
                                  ? "#1e3a5f"
                                  : "#eff6ff"
                                : "transparent",
                              borderWidth: day.isToday ? 1 : 0,
                              borderColor: theme.buttonPrimary,
                            }}
                          >
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => {
                                Haptics.impactAsync(
                                  Haptics.ImpactFeedbackStyle.Light,
                                );
                                setSelectedEventId(null);
                                setShowEventModal(true);
                              }}
                              className="cursor-pointer"
                            >
                              <Text
                                className="text-[11px] font-semibold"
                                style={{
                                  color: day.isCurrentMonth
                                    ? day.isToday
                                      ? theme.buttonPrimary
                                      : theme.textPrimary
                                    : theme.textTertiary,
                                }}
                              >
                                {day.date.getDate()}
                              </Text>
                            </TouchableOpacity>
                            <VStack className="gap-0.5 mt-0.5">
                              {visibleEvents.map((event, eventIndex) => (
                                <TouchableOpacity
                                  key={event.id}
                                  activeOpacity={0.7}
                                  onPress={() => {
                                    Haptics.impactAsync(
                                      Haptics.ImpactFeedbackStyle.Light,
                                    );
                                    handleEditEvent(event.id);
                                  }}
                                  className="cursor-pointer"
                                  style={{
                                    paddingHorizontal: 3,
                                    paddingVertical: 1,
                                    borderRadius: 3,
                                    backgroundColor:
                                      getEventColor(eventIndex),
                                  }}
                                >
                                  <Text
                                    className="text-[9px] font-medium"
                                    style={{ color: "#ffffff" }}
                                    numberOfLines={1}
                                  >
                                    {event.title}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                              {remainingCount > 0 && (
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  onPress={() => {
                                    Haptics.impactAsync(
                                      Haptics.ImpactFeedbackStyle.Light,
                                    );
                                    if (day.events.length > 0) {
                                      handleEditEvent(day.events[0].id);
                                    }
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Text
                                    className="px-1 text-[9px] font-medium"
                                    style={{ color: theme.textSecondary }}
                                  >
                                    +{remainingCount}
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </VStack>
                          </Box>
                        );
                      })}
                  </HStack>
                ))}
              </VStack>
              <TouchableOpacity
                onPress={handleGoToToday}
                activeOpacity={0.7}
                className="mt-2 cursor-pointer self-center"
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: theme.buttonPrimary,
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: "#ffffff" }}
                >
                  {t("teams.calendar.today")}
                </Text>
              </TouchableOpacity>
            </VStack>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={true}
              style={{
                maxHeight: scrollViewMaxHeight,
                paddingRight: 16,
              }}
              contentContainerStyle={{
                paddingBottom: 16,
              }}
            >
              {currentMonthEvents.length === 0 ? (
                <Box className="items-center justify-center py-12">
                  <Box
                    style={{
                      borderRadius: 999,
                      backgroundColor: theme.emptyBg,
                      padding: 20,
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={48}
                      color={theme.textTertiary}
                    />
                  </Box>
                  <Text
                    className="mb-2 text-xl font-bold"
                    style={{ color: theme.textPrimary }}
                  >
                    {t("teams.calendar.noEvents")}
                  </Text>
                  <Text
                    className="max-w-xs text-center text-sm"
                    style={{ color: theme.textSecondary }}
                  >
                    {canManageCalendar
                      ? t("teams.calendar.noEventsDescription")
                      : t("teams.calendar.noEventsMemberDescription")}
                  </Text>
                </Box>
              ) : (
                <VStack className="gap-0">
                  {currentMonthEvents.map(
                    ({ date, events: dateEvents }, dateIndex) => {
                      const eventDate = new Date(date);
                      const isToday =
                        eventDate.toDateString() === new Date().toDateString();
                      const dayOfWeek = eventDate.toLocaleDateString("en-US", {
                        weekday: "long",
                      });
                      const dayNumber = eventDate.getDate();
                      const monthName = eventDate.toLocaleDateString("en-US", {
                        month: "short",
                      });
                      const isFirstDate = dateIndex === 0;

                      const getEventColor = (index: number) => {
                        const colors = [
                          "#3b82f6",
                          "#10b981",
                          "#f59e0b",
                          "#ef4444",
                          "#8b5cf6",
                          "#ec4899",
                        ];
                        return colors[index % colors.length];
                      };

                      return (
                        <VStack key={date} className="gap-0">
                          {!isFirstDate && (
                            <Box
                              style={{
                                height: 1,
                                backgroundColor: isDark ? "#334155" : "#e2e8f0",
                                marginVertical: 20,
                              }}
                            />
                          )}
                          <Box
                            style={{
                              paddingVertical: 8,
                              paddingHorizontal: 12,
                              backgroundColor: isDark
                                ? isToday
                                  ? "#1e3a5f"
                                  : "#253141"
                                : isToday
                                  ? "#eff6ff"
                                  : "#f1f5f9",
                              borderRadius: 8,
                              marginBottom: 12,
                            }}
                          >
                            <Text
                              className="text-sm font-semibold"
                              style={{
                                color: isToday
                                  ? theme.buttonPrimary
                                  : theme.textPrimary,
                              }}
                            >
                              {dayOfWeek} – {dayNumber} {monthName}
                            </Text>
                          </Box>

                          <VStack className="gap-0">
                            {dateEvents.map((event, eventIndex) => {
                              const eventColor = getEventColor(eventIndex);
                              return (
                                <TouchableOpacity
                                  key={event.id}
                                  activeOpacity={0.6}
                                  onPress={() => handleEditEvent(event.id)}
                                  className="cursor-pointer"
                                  style={{
                                    paddingVertical: 12,
                                    paddingHorizontal: 12,
                                    paddingRight: 16,
                                    flexDirection: "row",
                                    alignItems: "flex-start",
                                    backgroundColor: isDark
                                      ? "#253141"
                                      : "#ffffff",
                                    borderRadius: 8,
                                    marginBottom: 8,
                                    borderWidth: 1,
                                    borderColor: isDark ? "#334155" : "#e2e8f0",
                                  }}
                                >
                                  <Box
                                    style={{
                                      width: 4,
                                      height: "100%",
                                      backgroundColor: eventColor,
                                      marginRight: 12,
                                      borderRadius: 2,
                                      minHeight: 40,
                                    }}
                                  />
                                  <VStack className="flex-1 gap-1">
                                    <Text
                                      className="text-base font-semibold"
                                      style={{ color: theme.textPrimary }}
                                    >
                                      {event.title}
                                    </Text>
                                    {event.description && (
                                      <HStack className="items-center gap-1.5">
                                        <Ionicons
                                          name="document-text-outline"
                                          size={14}
                                          color={theme.textSecondary}
                                        />
                                        <Text
                                          className="text-sm"
                                          style={{ color: theme.textSecondary }}
                                        >
                                          {event.description}
                                        </Text>
                                      </HStack>
                                    )}
                                    {event.group ? (
                                      <HStack className="mt-1 items-center gap-1.5">
                                        <Ionicons
                                          name="people"
                                          size={14}
                                          color={theme.textSecondary}
                                        />
                                        <Text
                                          className="text-xs"
                                          style={{
                                            color: theme.textSecondary,
                                          }}
                                        >
                                          {event.group.name}
                                        </Text>
                                      </HStack>
                                    ) : event.members && event.members.length > 0 ? (
                                      <HStack className="mt-1 flex-wrap gap-2">
                                        {event.members.map((eventMember) => {
                                          const teamMember = teamMembers.find(
                                            (m) => m.user_id === eventMember.user_id,
                                          );
                                          const displayName =
                                            eventMember.user?.full_name ||
                                            eventMember.user?.email.split("@")[0] ||
                                            "Unknown";
                                          return (
                                            <HStack
                                              key={eventMember.id}
                                              className="items-center gap-1.5"
                                            >
                                              {teamMember?.position && (
                                                <>
                                                  <Text
                                                    className="text-xs"
                                                    style={{
                                                      color: theme.textSecondary,
                                                    }}
                                                  >
                                                    {teamMember.position}
                                                  </Text>
                                                  <Box
                                                    style={{
                                                      width: 2,
                                                      height: 2,
                                                      borderRadius: 1,
                                                      backgroundColor:
                                                        theme.textTertiary,
                                                    }}
                                                  />
                                                </>
                                              )}
                                              <Text
                                                className="text-xs"
                                                style={{
                                                  color: theme.textSecondary,
                                                }}
                                              >
                                                {displayName}
                                              </Text>
                                            </HStack>
                                          );
                                        })}
                                      </HStack>
                                    ) : null}
                                  </VStack>
                                  <VStack
                                    className="items-end gap-1"
                                    style={{ minWidth: 60 }}
                                  >
                                    {event.is_all_day ? (
                                      <Text
                                        className="text-sm font-medium"
                                        style={{ color: theme.textSecondary }}
                                      >
                                        {t("teams.calendar.allDay")}
                                      </Text>
                                    ) : event.start_time ? (
                                      <>
                                        <Text
                                          className="text-sm font-medium"
                                          style={{ color: theme.textPrimary }}
                                        >
                                          {formatTime(event.start_time)}
                                        </Text>
                                        {event.end_time && (
                                          <Text
                                            className="text-sm font-medium"
                                            style={{
                                              color: theme.textSecondary,
                                            }}
                                          >
                                            {formatTime(event.end_time)}
                                          </Text>
                                        )}
                                      </>
                                    ) : null}
                                    {event.end_date &&
                                      event.end_date !== event.date && (
                                        <Text
                                          className="mt-1 text-xs"
                                          style={{ color: theme.textSecondary }}
                                        >
                                          {t("teams.calendar.until")}{" "}
                                          {new Date(
                                            event.end_date,
                                          ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                          })}
                                        </Text>
                                      )}
                                  </VStack>
                                </TouchableOpacity>
                              );
                            })}
                          </VStack>
                        </VStack>
                      );
                    },
                  )}
                </VStack>
              )}
            </ScrollView>
          )}
        </Box>
      </VStack>

      {showEventModal && (
        <CalendarEventModal
          visible={showEventModal}
          event={selectedEvent || undefined}
          teamId={teamId}
          members={teamUsers}
          isWorshipTeam={team?.type === "worship"}
          canManage={canManageCalendar}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEventId(null);
          }}
          onSave={handleSaveEvent}
          onDelete={
            selectedEventId && canManageCalendar
              ? () => handleDeleteEvent(selectedEventId)
              : undefined
          }
          isSaving={isCreating || isUpdating}
          isDeleting={isDeleting}
        />
      )}
    </SafeAreaView>
  );
}
