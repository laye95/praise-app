import { BottomSheetDrawerTextInput } from "@/components/ui/BottomSheetDrawer";
import { DrawerWithLayout } from "@/components/ui/DrawerWithLayout";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { teamCalendarService } from "@/services/api/teamCalendarService";
import { queryKeys } from "@/services/queryKeys";
import { TeamCalendarEvent } from "@/types/teamCalendar";
import { Ionicons } from "@expo/vector-icons";
import { useBottomSheetModal } from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";

interface UploadDocumentModalProps {
  visible: boolean;
  teamId: string;
  events: TeamCalendarEvent[];
  onClose: () => void;
  onUpload: (
    fileUri: string,
    fileName: string,
    eventId?: string,
  ) => Promise<void>;
  isUploading: boolean;
}

export function UploadDocumentModal({
  visible,
  teamId,
  events,
  onClose,
  onUpload,
  isUploading,
}: UploadDocumentModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { dismiss } = useBottomSheetModal();
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    size?: number;
  } | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(
    undefined,
  );
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [eventSearchQuery, setEventSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const searchDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const searchEventsQuery = useQuery({
    queryKey: queryKeys.teamCalendar.search(teamId, debouncedSearchQuery),
    queryFn: () =>
      teamCalendarService.getCalendarEvents(
        teamId,
        undefined,
        undefined,
        debouncedSearchQuery,
      ),
    enabled:
      !!teamId &&
      !!debouncedSearchQuery &&
      debouncedSearchQuery.trim().length > 0,
    staleTime: 1000 * 60 * 2,
  });

  const displayedEvents =
    debouncedSearchQuery.trim().length > 0
      ? searchEventsQuery.data || []
      : events;

  useEffect(() => {
    if (!visible) {
      setSelectedFile(null);
      setFileName("");
      setSelectedEventId(undefined);
      setShowEventDropdown(false);
    }
  }, [visible]);

  useEffect(() => {
    if (selectedFile) {
      setFileName(selectedFile.name);
    }
  }, [selectedFile]);

  useEffect(() => {
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }

    searchDebounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(eventSearchQuery);
    }, 300);

    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
      }
    };
  }, [eventSearchQuery]);

  useEffect(() => {
    if (!visible) {
      setEventSearchQuery("");
      setDebouncedSearchQuery("");
    }
  }, [visible]);

  const handleClose = () => {
    setSelectedFile(null);
    setFileName("");
    setSelectedEventId(undefined);
    setShowEventDropdown(false);
    dismiss();
  };

  const handlePickDocument = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile({
          uri: result.assets[0].uri,
          name: result.assets[0].name,
          size: result.assets[0].size,
        });
      }
    } catch (error) {
      console.error("Error picking document:", error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !fileName.trim() || isUploading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await onUpload(selectedFile.uri, fileName.trim(), selectedEventId);
    handleClose();
  };

  const canUpload = !!selectedFile && !!fileName.trim() && !isUploading;
  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <DrawerWithLayout
      visible={visible}
      onClose={onClose}
      title={t("teams.documents.uploadDocument")}
      subtitle={t("teams.documents.uploadDescription")}
      snapPoints={["75%"]}
      content={
        <VStack className="gap-5 px-6">
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
              <Text
                className="text-base font-bold"
                style={{ color: theme.textPrimary }}
              >
                {t("teams.documents.fileDetails")}
              </Text>
            </HStack>

            <VStack className="gap-2">
              <Text
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: theme.textSecondary }}
              >
                {t("teams.documents.selectFile")}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handlePickDocument}
                disabled={isUploading}
                className="cursor-pointer"
                style={{
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: isDark ? "#1e293b" : "#ffffff",
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: selectedFile
                    ? theme.buttonPrimary
                    : theme.cardBorder,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {selectedFile ? (
                  <VStack className="items-center gap-2">
                    <Ionicons
                      name="document-text"
                      size={32}
                      color={theme.buttonPrimary}
                    />
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: theme.textPrimary }}
                    >
                      {selectedFile.name}
                    </Text>
                    {selectedFile.size && (
                      <Text
                        className="text-xs"
                        style={{ color: theme.textSecondary }}
                      >
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Text>
                    )}
                  </VStack>
                ) : (
                  <VStack className="items-center gap-2">
                    <Ionicons
                      name="cloud-upload-outline"
                      size={32}
                      color={theme.textTertiary}
                    />
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: theme.textPrimary }}
                    >
                      {t("teams.documents.selectPDF")}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{ color: theme.textSecondary }}
                    >
                      {t("teams.documents.maxSize")}
                    </Text>
                  </VStack>
                )}
              </TouchableOpacity>
            </VStack>

            <VStack className="gap-2">
              <Text
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: theme.textSecondary }}
              >
                {t("teams.documents.fileName")}
              </Text>
              <Box
                className="rounded-xl"
                style={{
                  backgroundColor: isDark ? "#1e293b" : "#ffffff",
                  borderWidth: 1,
                  borderColor: isDark ? "#334155" : "#cbd5e1",
                }}
              >
                <BottomSheetDrawerTextInput
                  placeholder={t("teams.documents.fileNamePlaceholder")}
                  placeholderTextColor={theme.textTertiary}
                  value={fileName}
                  onChangeText={setFileName}
                  editable={!isUploading && !!selectedFile}
                  autoCapitalize="words"
                  returnKeyType="done"
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

          {events.length > 0 && (
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
                    {t("teams.documents.linkToEvent")}
                  </Text>
                  <Text
                    className="text-xs"
                    style={{ color: theme.textSecondary }}
                  >
                    {t("common.optional")}
                  </Text>
                </VStack>
              </HStack>

              <VStack className="gap-2">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowEventDropdown(!showEventDropdown)}
                  disabled={isUploading}
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
                    <HStack className="flex-1 items-center gap-3">
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color={theme.buttonPrimary}
                      />
                      <VStack className="flex-1">
                        <Text
                          className="text-base font-medium"
                          style={{
                            color: selectedEvent
                              ? theme.textPrimary
                              : theme.textTertiary,
                          }}
                        >
                          {selectedEvent
                            ? selectedEvent.title
                            : t("teams.documents.noEvent")}
                        </Text>
                        {selectedEvent && (
                          <Text
                            className="text-xs"
                            style={{ color: theme.textSecondary }}
                          >
                            {new Date(selectedEvent.date).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                    <Ionicons
                      name={showEventDropdown ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={theme.textSecondary}
                    />
                  </HStack>
                </TouchableOpacity>

                {showEventDropdown && (
                  <Box
                    className="rounded-xl"
                    style={{
                      backgroundColor: isDark ? "#1e293b" : "#ffffff",
                      borderWidth: 1,
                      borderColor: isDark ? "#334155" : "#cbd5e1",
                      maxHeight: 220,
                    }}
                  >
                    <Box
                      className="px-3 pb-2 pt-3"
                      style={{
                        borderBottomWidth: 1,
                        borderBottomColor: isDark ? "#334155" : "#e2e8f0",
                      }}
                    >
                      <Box
                        className="rounded-lg"
                        style={{
                          backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                          borderWidth: 1,
                          borderColor: isDark ? "#334155" : "#cbd5e1",
                        }}
                      >
                        <HStack className="items-center gap-2 px-3">
                          <Ionicons
                            name="search"
                            size={18}
                            color={theme.textSecondary}
                          />
                          <BottomSheetDrawerTextInput
                            placeholder={t("teams.documents.searchEvents")}
                            placeholderTextColor={theme.textTertiary}
                            value={eventSearchQuery}
                            onChangeText={setEventSearchQuery}
                            editable={!isUploading}
                            style={{
                              flex: 1,
                              color: theme.textPrimary,
                              fontSize: 15,
                              paddingVertical: 10,
                            }}
                          />
                          {eventSearchQuery.length > 0 && (
                            <TouchableOpacity
                              onPress={() => {
                                setEventSearchQuery("");
                                setDebouncedSearchQuery("");
                              }}
                              activeOpacity={0.7}
                              className="cursor-pointer"
                            >
                              <Ionicons
                                name="close-circle"
                                size={18}
                                color={theme.textSecondary}
                              />
                            </TouchableOpacity>
                          )}
                        </HStack>
                      </Box>
                    </Box>
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                      style={{ maxHeight: 180 }}
                    >
                      {debouncedSearchQuery.trim().length > 0 &&
                      searchEventsQuery.isLoading ? (
                        <Box className="items-center justify-center py-8">
                          <ActivityIndicator
                            size="small"
                            color={theme.buttonPrimary}
                          />
                          <Text
                            className="mt-2 text-sm"
                            style={{ color: theme.textSecondary }}
                          >
                            {t("teams.documents.searching")}
                          </Text>
                        </Box>
                      ) : (
                        <>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => {
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light,
                              );
                              setSelectedEventId(undefined);
                              setShowEventDropdown(false);
                              setEventSearchQuery("");
                              setDebouncedSearchQuery("");
                            }}
                            className="cursor-pointer"
                            style={{
                              padding: 14,
                              borderBottomWidth:
                                displayedEvents.length > 0 ? 1 : 0,
                              borderBottomColor: isDark ? "#334155" : "#e2e8f0",
                            }}
                          >
                            <HStack className="items-center gap-3">
                              <Box
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: 10,
                                  borderWidth: 2,
                                  borderColor:
                                    selectedEventId === undefined
                                      ? theme.buttonPrimary
                                      : theme.textTertiary,
                                  backgroundColor:
                                    selectedEventId === undefined
                                      ? theme.buttonPrimary
                                      : "transparent",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {selectedEventId === undefined && (
                                  <Ionicons
                                    name="checkmark"
                                    size={12}
                                    color="#ffffff"
                                  />
                                )}
                              </Box>
                              <Text
                                className="text-base font-medium"
                                style={{ color: theme.textPrimary }}
                              >
                                {t("teams.documents.noEvent")}
                              </Text>
                            </HStack>
                          </TouchableOpacity>
                          {displayedEvents.length === 0 ? (
                            <Box className="items-center justify-center px-4 py-8">
                              <Ionicons
                                name="search-outline"
                                size={32}
                                color={theme.textTertiary}
                              />
                              <Text
                                className="mt-2 text-center text-sm font-medium"
                                style={{ color: theme.textPrimary }}
                              >
                                {t("teams.documents.noEventsFound")}
                              </Text>
                              <Text
                                className="mt-1 text-center text-xs"
                                style={{ color: theme.textSecondary }}
                              >
                                {t("teams.documents.tryDifferentSearch")}
                              </Text>
                            </Box>
                          ) : (
                            displayedEvents.map((event) => (
                              <TouchableOpacity
                                key={event.id}
                                activeOpacity={0.7}
                                onPress={() => {
                                  Haptics.impactAsync(
                                    Haptics.ImpactFeedbackStyle.Light,
                                  );
                                  setSelectedEventId(event.id);
                                  setShowEventDropdown(false);
                                }}
                                className="cursor-pointer"
                                style={{
                                  padding: 14,
                                  borderBottomWidth:
                                    event.id !==
                                    displayedEvents[displayedEvents.length - 1]
                                      .id
                                      ? 1
                                      : 0,
                                  borderBottomColor: isDark
                                    ? "#334155"
                                    : "#e2e8f0",
                                }}
                              >
                                <HStack className="items-center gap-3">
                                  <Box
                                    style={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: 10,
                                      borderWidth: 2,
                                      borderColor:
                                        selectedEventId === event.id
                                          ? theme.buttonPrimary
                                          : theme.textTertiary,
                                      backgroundColor:
                                        selectedEventId === event.id
                                          ? theme.buttonPrimary
                                          : "transparent",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    {selectedEventId === event.id && (
                                      <Ionicons
                                        name="checkmark"
                                        size={12}
                                        color="#ffffff"
                                      />
                                    )}
                                  </Box>
                                  <VStack className="flex-1">
                                    <Text
                                      className="text-base font-medium"
                                      style={{ color: theme.textPrimary }}
                                    >
                                      {event.title}
                                    </Text>
                                    <Text
                                      className="text-xs"
                                      style={{ color: theme.textSecondary }}
                                    >
                                      {new Date(event.date).toLocaleDateString(
                                        "en-US",
                                        {
                                          weekday: "long",
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        },
                                      )}
                                    </Text>
                                  </VStack>
                                </HStack>
                              </TouchableOpacity>
                            ))
                          )}
                        </>
                      )}
                    </ScrollView>
                  </Box>
                )}
              </VStack>
            </VStack>
          )}
        </VStack>
      }
      saveButton={{
        label: isUploading
          ? t("teams.documents.uploading")
          : t("teams.documents.uploadDocument"),
        onPress: handleUpload,
        disabled: !canUpload,
        loading: isUploading,
      }}
      cancelButton={{
        label: t("common.cancel"),
        onPress: handleClose,
        disabled: isUploading,
      }}
    />
  );
}
