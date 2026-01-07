import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import {
  CreateCalendarEventData,
  TeamCalendarEvent,
  UpdateCalendarEventData,
} from "@/types/teamCalendar";
import { User } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Linking,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTeamDocuments } from "../../documents/_hooks/useTeamDocuments";
import { useTeamGroups } from "../../groups/_hooks/useTeamGroups";
import { useTeam } from "../../../_hooks/useTeam";

interface CalendarEventModalProps {
  visible: boolean;
  event?: TeamCalendarEvent;
  teamId: string;
  members: Pick<User, "id" | "email" | "full_name">[];
  isWorshipTeam: boolean;
  canManage: boolean;
  onClose: () => void;
  onSave: (
    data: CreateCalendarEventData | UpdateCalendarEventData,
  ) => Promise<void>;
  onDelete?: () => Promise<void>;
  isSaving: boolean;
  isDeleting?: boolean;
}

export function CalendarEventModal({
  visible,
  event,
  teamId,
  members,
  isWorshipTeam,
  canManage,
  onClose,
  onSave,
  onDelete,
  isSaving,
  isDeleting = false,
}: CalendarEventModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { documents, getDocumentUrl } = useTeamDocuments(teamId);
  const { groups } = useTeamGroups(teamId);
  const { members: teamMembers } = useTeam(teamId);

  const eventDocuments = event
    ? documents.filter((doc) => doc.event_id === event.id)
    : [];
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [selectedDate, setSelectedDate] = useState(
    event?.date ? new Date(event.date) : new Date(),
  );
  const [endDate, setEndDate] = useState(
    event?.end_date ? new Date(event.end_date) : undefined,
  );
  const [isAllDay, setIsAllDay] = useState(event?.is_all_day || false);
  const [startTime, setStartTime] = useState<Date>(() => {
    if (event?.start_time) {
      const [hours, minutes] = event.start_time.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
    const date = new Date();
    date.setHours(9, 0, 0, 0);
    return date;
  });
  const [endTime, setEndTime] = useState<Date>(() => {
    if (event?.end_time) {
      const [hours, minutes] = event.end_time.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
    const date = new Date();
    date.setHours(10, 0, 0, 0);
    return date;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [assignmentType, setAssignmentType] = useState<"members" | "group">("members");
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const titleInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setTitle(event?.title || "");
      setDescription(event?.description || "");
      setSelectedDate(event?.date ? new Date(event.date) : new Date());
      setEndDate(event?.end_date ? new Date(event.end_date) : undefined);
      setIsAllDay(event?.is_all_day || false);

      if (event?.start_time) {
        const [hours, minutes] = event.start_time.split(":").map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        setStartTime(date);
      } else {
        const date = new Date();
        date.setHours(9, 0, 0, 0);
        setStartTime(date);
      }

      if (event?.end_time) {
        const [hours, minutes] = event.end_time.split(":").map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        setEndTime(date);
      } else {
        const date = new Date();
        date.setHours(10, 0, 0, 0);
        setEndTime(date);
      }

      if (event?.group_id) {
        setAssignmentType("group");
        setSelectedGroupId(event.group_id);
        setSelectedMemberIds(new Set());
      } else if (event?.members && event.members.length > 0) {
        setAssignmentType("members");
        setSelectedGroupId(undefined);
        setSelectedMemberIds(new Set(event.members.map((m) => m.user_id)));
      } else {
        setAssignmentType("members");
        setSelectedGroupId(undefined);
        setSelectedMemberIds(new Set());
      }

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
  }, [visible, event, slideAnim, fadeAnim]);

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
      setTitle("");
      setDescription("");
      setSelectedDate(new Date());
      setEndDate(undefined);
      setIsAllDay(false);
      const date = new Date();
      date.setHours(9, 0, 0, 0);
      setStartTime(date);
      const endDate = new Date();
      endDate.setHours(10, 0, 0, 0);
      setEndTime(endDate);
      setAssignmentType("members");
      setSelectedGroupId(undefined);
      setShowGroupPicker(false);
      onClose();
    });
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSave = async () => {
    if (!title.trim() || isSaving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();

    const data: CreateCalendarEventData | UpdateCalendarEventData = {
      date: formatDateLocal(selectedDate),
      end_date: endDate ? formatDateLocal(endDate) : undefined,
      is_all_day: isAllDay,
      start_time: isAllDay ? undefined : formatTime(startTime),
      end_time: isAllDay ? undefined : formatTime(endTime),
      title: title.trim(),
      description: description.trim() || undefined,
      group_id: assignmentType === "group" ? selectedGroupId : null,
      member_ids: assignmentType === "members" ? Array.from(selectedMemberIds) : [],
    };

    await onSave(data);
  };

  const canSave = title.trim().length >= 2 && !isSaving;

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
                    {event
                      ? t("teams.calendar.editEvent")
                      : t("teams.calendar.createEvent")}
                  </Text>
                  <HStack className="items-center gap-2">
                    {onDelete && canManage && event && (
                      <TouchableOpacity
                        onPress={async () => {
                          if (onDelete) {
                            await onDelete();
                            handleClose();
                          }
                        }}
                        disabled={isDeleting}
                        activeOpacity={0.7}
                        className="cursor-pointer"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: isDark ? "#7f1d1d" : "#fef2f2",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isDeleting ? (
                          <ActivityIndicator size="small" color="#dc2626" />
                        ) : (
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color={isDark ? "#f87171" : "#ef4444"}
                          />
                        )}
                      </TouchableOpacity>
                    )}
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
                </HStack>
                <Text
                  className="mt-1 text-sm"
                  style={{ color: theme.textSecondary }}
                >
                  {t("teams.calendar.eventDescription")}
                </Text>
              </Box>

              <ScrollView
                showsVerticalScrollIndicator={false}
                className="px-6"
                style={{ maxHeight: 500 }}
                contentContainerStyle={{ paddingBottom: 0 }}
                keyboardShouldPersistTaps="handled"
              >
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
                          name="create-outline"
                          size={20}
                          color={theme.buttonPrimary}
                        />
                      </Box>
                      <Text
                        className="text-base font-bold"
                        style={{ color: theme.textPrimary }}
                      >
                        {t("teams.calendar.basicInfo")}
                      </Text>
                    </HStack>

                    <VStack className="gap-2">
                      <Text
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: theme.textSecondary }}
                      >
                        {t("teams.calendar.eventTitle")}
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
                          ref={titleInputRef}
                          placeholder={t(
                            "teams.calendar.eventTitlePlaceholder",
                          )}
                          placeholderTextColor={theme.textTertiary}
                          value={title}
                          onChangeText={setTitle}
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

                    <VStack className="gap-2">
                      <Text
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: theme.textSecondary }}
                      >
                        {t("teams.description")}{" "}
                        <Text
                          style={{
                            color: theme.textTertiary,
                            textTransform: "lowercase",
                          }}
                        >
                          ({t("common.optional")})
                        </Text>
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
                          ref={descriptionInputRef}
                          placeholder={t(
                            "teams.calendar.eventDescriptionPlaceholder",
                          )}
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
                      <Text
                        className="text-base font-bold"
                        style={{ color: theme.textPrimary }}
                      >
                        {t("teams.calendar.dateTime")}
                      </Text>
                    </HStack>

                    <VStack className="gap-2">
                      <Text
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: theme.textSecondary }}
                      >
                        {t("teams.calendar.eventDate")}
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setShowDatePicker(true)}
                        disabled={isSaving}
                        className="cursor-pointer"
                        style={{
                          padding: 14,
                          borderRadius: 12,
                          backgroundColor: isDark ? "#1e293b" : "#ffffff",
                          borderWidth: 1,
                          borderColor: isDark ? "#334155" : "#cbd5e1",
                        }}
                      >
                        <HStack className="items-center gap-3">
                          <Ionicons
                            name="calendar-outline"
                            size={20}
                            color={theme.buttonPrimary}
                          />
                          <Text
                            className="text-base font-medium"
                            style={{ color: theme.textPrimary }}
                          >
                            {selectedDate.toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </Text>
                        </HStack>
                      </TouchableOpacity>
                      {showDatePicker && (
                        <DateTimePicker
                          value={selectedDate}
                          mode="date"
                          display={
                            Platform.OS === "ios" ? "spinner" : "default"
                          }
                          onChange={(event, date) => {
                            setShowDatePicker(Platform.OS === "ios");
                            if (date) {
                              setSelectedDate(date);
                            }
                          }}
                          minimumDate={new Date()}
                        />
                      )}
                    </VStack>

                    <VStack className="gap-2">
                      <Text
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: theme.textSecondary }}
                      >
                        {t("teams.calendar.endDate")}{" "}
                        <Text
                          style={{
                            color: theme.textTertiary,
                            textTransform: "lowercase",
                          }}
                        >
                          ({t("common.optional")})
                        </Text>
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setShowEndDatePicker(true)}
                        disabled={isSaving}
                        className="cursor-pointer"
                        style={{
                          padding: 14,
                          borderRadius: 12,
                          backgroundColor: isDark ? "#1e293b" : "#ffffff",
                          borderWidth: 1,
                          borderColor: isDark ? "#334155" : "#cbd5e1",
                        }}
                      >
                        <HStack className="items-center gap-3">
                          <Ionicons
                            name="calendar-outline"
                            size={20}
                            color={theme.buttonPrimary}
                          />
                          <Text
                            className="text-base font-medium"
                            style={{
                              color: endDate
                                ? theme.textPrimary
                                : theme.textTertiary,
                            }}
                          >
                            {endDate
                              ? endDate.toLocaleDateString("en-US", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : t("teams.calendar.noEndDate")}
                          </Text>
                        </HStack>
                      </TouchableOpacity>
                      {showEndDatePicker && (
                        <DateTimePicker
                          value={endDate || selectedDate}
                          mode="date"
                          display={
                            Platform.OS === "ios" ? "spinner" : "default"
                          }
                          onChange={(event, date) => {
                            setShowEndDatePicker(Platform.OS === "ios");
                            if (date) {
                              setEndDate(date);
                            }
                          }}
                          minimumDate={selectedDate}
                        />
                      )}
                    </VStack>

                    <Box
                      className="h-px"
                      style={{
                        backgroundColor: isDark ? "#334155" : "#e2e8f0",
                      }}
                    />

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setIsAllDay(!isAllDay)}
                      disabled={isSaving}
                      className="cursor-pointer"
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor: isDark ? "#1e293b" : "#ffffff",
                        borderWidth: 1,
                        borderColor: isDark ? "#334155" : "#cbd5e1",
                      }}
                    >
                      <Box
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          borderWidth: 2,
                          borderColor: isAllDay
                            ? theme.buttonPrimary
                            : theme.textTertiary,
                          backgroundColor: isAllDay
                            ? theme.buttonPrimary
                            : "transparent",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isAllDay && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color="#ffffff"
                          />
                        )}
                      </Box>
                      <Text
                        className="text-base font-medium"
                        style={{ color: theme.textPrimary }}
                      >
                        {t("teams.calendar.allDay")}
                      </Text>
                    </TouchableOpacity>

                    {!isAllDay && (
                      <HStack className="gap-3">
                        <VStack className="flex-1 gap-2">
                          <Text
                            className="text-xs font-semibold uppercase tracking-wide"
                            style={{ color: theme.textSecondary }}
                          >
                            {t("teams.calendar.startTime")}
                          </Text>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => setShowStartTimePicker(true)}
                            disabled={isSaving}
                            className="cursor-pointer"
                            style={{
                              padding: 14,
                              borderRadius: 12,
                              backgroundColor: isDark ? "#1e293b" : "#ffffff",
                              borderWidth: 1,
                              borderColor: isDark ? "#334155" : "#cbd5e1",
                            }}
                          >
                            <HStack className="items-center gap-2">
                              <Ionicons
                                name="time-outline"
                                size={20}
                                color={theme.buttonPrimary}
                              />
                              <Text
                                className="text-base font-medium"
                                style={{ color: theme.textPrimary }}
                              >
                                {startTime.toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                })}
                              </Text>
                            </HStack>
                          </TouchableOpacity>
                          {showStartTimePicker && (
                            <DateTimePicker
                              value={startTime}
                              mode="time"
                              display={
                                Platform.OS === "ios" ? "spinner" : "default"
                              }
                              onChange={(event, date) => {
                                setShowStartTimePicker(Platform.OS === "ios");
                                if (date) {
                                  setStartTime(date);
                                  if (date >= endTime) {
                                    const newEndTime = new Date(date);
                                    newEndTime.setHours(date.getHours() + 1);
                                    setEndTime(newEndTime);
                                  }
                                }
                              }}
                            />
                          )}
                        </VStack>

                        <VStack className="flex-1 gap-2">
                          <Text
                            className="text-xs font-semibold uppercase tracking-wide"
                            style={{ color: theme.textSecondary }}
                          >
                            {t("teams.calendar.endTime")}
                          </Text>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => setShowEndTimePicker(true)}
                            disabled={isSaving}
                            className="cursor-pointer"
                            style={{
                              padding: 14,
                              borderRadius: 12,
                              backgroundColor: isDark ? "#1e293b" : "#ffffff",
                              borderWidth: 1,
                              borderColor: isDark ? "#334155" : "#cbd5e1",
                            }}
                          >
                            <HStack className="items-center gap-2">
                              <Ionicons
                                name="time-outline"
                                size={20}
                                color={theme.buttonPrimary}
                              />
                              <Text
                                className="text-base font-medium"
                                style={{ color: theme.textPrimary }}
                              >
                                {endTime.toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                })}
                              </Text>
                            </HStack>
                          </TouchableOpacity>
                          {showEndTimePicker && (
                            <DateTimePicker
                              value={endTime}
                              mode="time"
                              display={
                                Platform.OS === "ios" ? "spinner" : "default"
                              }
                              onChange={(event, date) => {
                                setShowEndTimePicker(Platform.OS === "ios");
                                if (date && date > startTime) {
                                  setEndTime(date);
                                }
                              }}
                              minimumDate={startTime}
                            />
                          )}
                        </VStack>
                      </HStack>
                    )}
                  </VStack>

                  {isWorshipTeam && (
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
                            name="people"
                            size={20}
                            color={theme.buttonPrimary}
                          />
                        </Box>
                        <VStack className="flex-1">
                          <Text
                            className="text-base font-bold"
                            style={{ color: theme.textPrimary }}
                          >
                            {t("teams.calendar.assignTo")}
                          </Text>
                          <Text
                            className="text-xs"
                            style={{ color: theme.textSecondary }}
                          >
                            {t("teams.calendar.assignToDescription")}
                          </Text>
                        </VStack>
                      </HStack>

                      <HStack className="gap-2">
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setAssignmentType("members");
                            setSelectedGroupId(undefined);
                            if (selectedGroupId) {
                              setSelectedMemberIds(new Set());
                            }
                          }}
                          disabled={isSaving}
                          className="flex-1 cursor-pointer"
                          style={{
                            padding: 12,
                            borderRadius: 12,
                            backgroundColor:
                              assignmentType === "members"
                                ? theme.buttonPrimary
                                : isDark
                                  ? "#1e293b"
                                  : "#ffffff",
                            borderWidth: 1,
                            borderColor:
                              assignmentType === "members"
                                ? theme.buttonPrimary
                                : isDark
                                  ? "#334155"
                                  : "#cbd5e1",
                          }}
                        >
                          <Text
                            className="text-sm font-semibold text-center"
                            style={{
                              color:
                                assignmentType === "members"
                                  ? "#ffffff"
                                  : theme.textPrimary,
                            }}
                          >
                            {t("teams.calendar.assignMembers")}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setAssignmentType("group");
                            setSelectedMemberIds(new Set());
                            if (!selectedGroupId && groups.length > 0) {
                              setShowGroupPicker(true);
                            }
                          }}
                          disabled={isSaving}
                          className="flex-1 cursor-pointer"
                          style={{
                            padding: 12,
                            borderRadius: 12,
                            backgroundColor:
                              assignmentType === "group"
                                ? theme.buttonPrimary
                                : isDark
                                  ? "#1e293b"
                                  : "#ffffff",
                            borderWidth: 1,
                            borderColor:
                              assignmentType === "group"
                                ? theme.buttonPrimary
                                : isDark
                                  ? "#334155"
                                  : "#cbd5e1",
                          }}
                        >
                          <Text
                            className="text-sm font-semibold text-center"
                            style={{
                              color:
                                assignmentType === "group"
                                  ? "#ffffff"
                                  : theme.textPrimary,
                            }}
                          >
                            {t("teams.calendar.assignGroup")}
                          </Text>
                        </TouchableOpacity>
                      </HStack>

                      {assignmentType === "members" && (
                        <VStack className="gap-2">
                          {teamMembers.length > 0 ? (
                            teamMembers.map((member) => {
                              const displayName =
                                member.user?.full_name ||
                                member.user?.email.split("@")[0] ||
                                "Unknown";
                              const isSelected = selectedMemberIds.has(member.user_id);
                              return (
                                <TouchableOpacity
                                  key={member.id}
                                  activeOpacity={0.7}
                                  onPress={() => {
                                    Haptics.impactAsync(
                                      Haptics.ImpactFeedbackStyle.Light,
                                    );
                                    setSelectedMemberIds((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(member.user_id)) {
                                        next.delete(member.user_id);
                                      } else {
                                        next.add(member.user_id);
                                      }
                                      return next;
                                    });
                                  }}
                                  disabled={isSaving}
                                  className="cursor-pointer"
                                >
                                  <HStack
                                    className="items-center gap-3 rounded-xl p-3"
                                    style={{
                                      backgroundColor: isSelected
                                        ? isDark
                                          ? "#1e3a5f"
                                          : "#eff6ff"
                                        : isDark
                                          ? "#1e293b"
                                          : "#ffffff",
                                      borderWidth: 1,
                                      borderColor: isSelected
                                        ? theme.buttonPrimary
                                        : isDark
                                          ? "#334155"
                                          : "#cbd5e1",
                                    }}
                                  >
                                    <Box
                                      className="rounded-lg"
                                      style={{
                                        backgroundColor: isSelected
                                          ? theme.buttonPrimary
                                          : isDark
                                            ? "#0f172a"
                                            : "#ffffff",
                                        borderWidth: 2,
                                        borderColor: isSelected
                                          ? theme.buttonPrimary
                                          : isDark
                                            ? "#64748b"
                                            : "#94a3b8",
                                        width: 28,
                                        height: 28,
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      {isSelected ? (
                                        <Ionicons
                                          name="checkmark"
                                          size={18}
                                          color="#ffffff"
                                        />
                                      ) : (
                                        <Box
                                          style={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: 2,
                                            backgroundColor: isDark
                                              ? "#334155"
                                              : "#e2e8f0",
                                          }}
                                        />
                                      )}
                                    </Box>
                                    {member.position && (
                                      <Ionicons
                                        name="musical-notes"
                                        size={18}
                                        color={theme.buttonPrimary}
                                      />
                                    )}
                                    <VStack className="flex-1">
                                      {member.position && (
                                        <Text
                                          className="text-sm font-semibold"
                                          style={{ color: theme.textPrimary }}
                                        >
                                          {member.position}
                                        </Text>
                                      )}
                                      <Text
                                        className={`text-xs ${member.position ? "" : "font-semibold"}`}
                                        style={{ color: theme.textSecondary }}
                                      >
                                        {displayName}
                                      </Text>
                                    </VStack>
                                  </HStack>
                                </TouchableOpacity>
                              );
                            })
                          ) : (
                            <Text
                              className="text-sm text-center py-4"
                              style={{ color: theme.textSecondary }}
                            >
                              {t("teams.calendar.noPositionsAssigned")}
                            </Text>
                          )}
                        </VStack>
                      )}

                      {assignmentType === "group" && (
                        <VStack className="gap-2">
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => {
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light,
                              );
                              setShowGroupPicker(!showGroupPicker);
                            }}
                            disabled={isSaving || groups.length === 0}
                            className="cursor-pointer"
                            style={{
                              padding: 14,
                              borderRadius: 12,
                              backgroundColor: isDark ? "#1e293b" : "#ffffff",
                              borderWidth: 1,
                              borderColor: isDark ? "#334155" : "#cbd5e1",
                            }}
                          >
                            <HStack className="items-center justify-between">
                              <Text
                                className="text-base font-medium"
                                style={{
                                  color: selectedGroupId
                                    ? theme.textPrimary
                                    : theme.textTertiary,
                                }}
                              >
                                {selectedGroupId
                                  ? groups.find((g) => g.id === selectedGroupId)
                                      ?.name || t("teams.calendar.selectGroup")
                                  : t("teams.calendar.selectGroup")}
                              </Text>
                              <Ionicons
                                name={
                                  showGroupPicker
                                    ? "chevron-up"
                                    : "chevron-down"
                                }
                                size={20}
                                color={theme.textSecondary}
                              />
                            </HStack>
                          </TouchableOpacity>

                          {showGroupPicker && groups.length > 0 && (
                            <VStack
                              className="gap-1 rounded-xl p-2"
                              style={{
                                backgroundColor: isDark ? "#1e293b" : "#ffffff",
                                borderWidth: 1,
                                borderColor: isDark ? "#334155" : "#cbd5e1",
                                maxHeight: 200,
                              }}
                            >
                              <ScrollView
                                showsVerticalScrollIndicator={true}
                                nestedScrollEnabled={true}
                              >
                                {groups.map((group) => (
                                  <TouchableOpacity
                                    key={group.id}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                      Haptics.impactAsync(
                                        Haptics.ImpactFeedbackStyle.Light,
                                      );
                                      setSelectedGroupId(group.id);
                                      setShowGroupPicker(false);
                                    }}
                                    className="cursor-pointer"
                                    style={{
                                      padding: 12,
                                      borderRadius: 8,
                                      backgroundColor:
                                        selectedGroupId === group.id
                                          ? theme.buttonPrimary
                                          : "transparent",
                                    }}
                                  >
                                    <Text
                                      className="text-sm font-medium"
                                      style={{
                                        color:
                                          selectedGroupId === group.id
                                            ? "#ffffff"
                                            : theme.textPrimary,
                                      }}
                                    >
                                      {group.name}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </ScrollView>
                            </VStack>
                          )}

                          {groups.length === 0 && (
                            <Text
                              className="text-sm text-center py-4"
                              style={{ color: theme.textSecondary }}
                            >
                              {t("teams.calendar.noGroupsAvailable")}
                            </Text>
                          )}
                        </VStack>
                      )}
                    </VStack>
                  )}

                  {isWorshipTeam && event && eventDocuments.length > 0 && (
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
                            name="document-text"
                            size={20}
                            color={theme.buttonPrimary}
                          />
                        </Box>
                        <VStack className="flex-1">
                          <Text
                            className="text-base font-bold"
                            style={{ color: theme.textPrimary }}
                          >
                            {t("teams.calendar.attachedDocuments")}
                          </Text>
                          <Text
                            className="text-xs"
                            style={{ color: theme.textSecondary }}
                          >
                            {t("teams.calendar.attachedDocumentsDescription")}
                          </Text>
                        </VStack>
                      </HStack>

                      <VStack className="gap-2">
                        {eventDocuments.map((document) => (
                          <TouchableOpacity
                            key={document.id}
                            activeOpacity={0.7}
                            onPress={async () => {
                              try {
                                Haptics.impactAsync(
                                  Haptics.ImpactFeedbackStyle.Light,
                                );
                                const url = await getDocumentUrl(document.id);
                                if (url) {
                                  const canOpen = await Linking.canOpenURL(url);
                                  if (canOpen) {
                                    await Linking.openURL(url);
                                  }
                                }
                              } catch (error) {
                                console.error(
                                  "Failed to open document:",
                                  error,
                                );
                              }
                            }}
                            className="cursor-pointer"
                            style={{
                              padding: 12,
                              borderRadius: 12,
                              backgroundColor: isDark ? "#1e293b" : "#ffffff",
                              borderWidth: 1,
                              borderColor: isDark ? "#334155" : "#cbd5e1",
                            }}
                          >
                            <HStack className="items-center gap-3">
                              <Box
                                className="rounded-lg p-2"
                                style={{
                                  backgroundColor: isDark
                                    ? "#7f1d1d"
                                    : "#fee2e2",
                                }}
                              >
                                <Ionicons
                                  name="document-text"
                                  size={20}
                                  color={isDark ? "#f87171" : "#ef4444"}
                                />
                              </Box>
                              <VStack className="flex-1 gap-0.5">
                                <Text
                                  className="text-sm font-semibold"
                                  style={{ color: theme.textPrimary }}
                                >
                                  {document.file_name}
                                </Text>
                                {document.file_size && (
                                  <Text
                                    className="text-xs"
                                    style={{ color: theme.textSecondary }}
                                  >
                                    {(document.file_size / 1024 / 1024).toFixed(
                                      2,
                                    )}{" "}
                                    MB
                                  </Text>
                                )}
                              </VStack>
                              <Ionicons
                                name="chevron-forward"
                                size={18}
                                color={theme.textTertiary}
                              />
                            </HStack>
                          </TouchableOpacity>
                        ))}
                      </VStack>
                    </VStack>
                  )}
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
                          {t("teams.calendar.saving")}
                        </ButtonText>
                      </HStack>
                    ) : (
                      <ButtonText
                        className="text-base font-semibold"
                        style={{ color: "#ffffff" }}
                      >
                        {event
                          ? t("common.save")
                          : t("teams.calendar.createEvent")}
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
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
