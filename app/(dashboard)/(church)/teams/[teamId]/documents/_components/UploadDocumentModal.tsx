import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { TeamCalendarEvent } from "@/types/teamCalendar";
import { teamCalendarService } from "@/services/api/teamCalendarService";
import { queryKeys } from "@/services/queryKeys";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

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
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
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
  const fileNameInputRef = useRef<TextInput>(null);
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const searchEventsQuery = useQuery({
    queryKey: queryKeys.teamCalendar.search(teamId, debouncedSearchQuery),
    queryFn: () => teamCalendarService.getCalendarEvents(teamId, undefined, undefined, debouncedSearchQuery),
    enabled: !!teamId && !!debouncedSearchQuery && debouncedSearchQuery.trim().length > 0,
    staleTime: 1000 * 60 * 2,
  });
  
  const displayedEvents = debouncedSearchQuery.trim().length > 0
    ? (searchEventsQuery.data || [])
    : events;

  useEffect(() => {
    if (visible) {
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
      setSelectedFile(null);
      setFileName("");
      setSelectedEventId(undefined);
      setShowEventDropdown(false);
    }
  }, [visible, slideAnim, fadeAnim]);

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
      setSelectedFile(null);
      setFileName("");
      setSelectedEventId(undefined);
      setShowEventDropdown(false);
      onClose();
    });
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
                    {t("teams.documents.uploadDocument")}
                  </Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    activeOpacity={0.7}
                    disabled={isUploading}
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
                  {t("teams.documents.uploadDescription")}
                </Text>
              </Box>

              <ScrollView
                showsVerticalScrollIndicator={false}
                className="px-6"
                style={{ flex: 1, maxHeight: 500 }}
                contentContainerStyle={{ paddingBottom: 16 }}
                keyboardShouldPersistTaps="handled"
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
                        <Ionicons name="document-text" size={20} color={theme.buttonPrimary} />
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
                        <TextInput
                          ref={fileNameInputRef}
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
                            <HStack className="items-center gap-3 flex-1">
                              <Ionicons
                                name="calendar-outline"
                                size={20}
                                color={theme.buttonPrimary}
                              />
                              <VStack className="flex-1">
                                <Text
                                  className="text-base font-medium"
                                  style={{ color: selectedEvent ? theme.textPrimary : theme.textTertiary }}
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
                                    {new Date(selectedEvent.date).toLocaleDateString("en-US", {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
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
                              maxHeight: 300,
                            }}
                          >
                            <Box
                              className="px-3 pt-3 pb-2"
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
                                  <TextInput
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
                              style={{ maxHeight: 220 }}
                            >
                              {debouncedSearchQuery.trim().length > 0 && searchEventsQuery.isLoading ? (
                                <Box className="items-center justify-center py-8">
                                  <ActivityIndicator size="small" color={theme.buttonPrimary} />
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
                                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                      setSelectedEventId(undefined);
                                      setShowEventDropdown(false);
                                      setEventSearchQuery("");
                                      setDebouncedSearchQuery("");
                                    }}
                                    className="cursor-pointer"
                                    style={{
                                      padding: 14,
                                      borderBottomWidth: displayedEvents.length > 0 ? 1 : 0,
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
                                          borderColor: selectedEventId === undefined
                                            ? theme.buttonPrimary
                                            : theme.textTertiary,
                                          backgroundColor: selectedEventId === undefined
                                            ? theme.buttonPrimary
                                            : "transparent",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        {selectedEventId === undefined && (
                                          <Ionicons name="checkmark" size={12} color="#ffffff" />
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
                                    <Box className="items-center justify-center py-8 px-4">
                                      <Ionicons
                                        name="search-outline"
                                        size={32}
                                        color={theme.textTertiary}
                                      />
                                      <Text
                                        className="mt-2 text-sm font-medium text-center"
                                        style={{ color: theme.textPrimary }}
                                      >
                                        {t("teams.documents.noEventsFound")}
                                      </Text>
                                      <Text
                                        className="mt-1 text-xs text-center"
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
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setSelectedEventId(event.id);
                                    setShowEventDropdown(false);
                                  }}
                                  className="cursor-pointer"
                                      style={{
                                        padding: 14,
                                        borderBottomWidth: event.id !== displayedEvents[displayedEvents.length - 1].id ? 1 : 0,
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
                                            borderColor: selectedEventId === event.id
                                              ? theme.buttonPrimary
                                              : theme.textTertiary,
                                            backgroundColor: selectedEventId === event.id
                                              ? theme.buttonPrimary
                                              : "transparent",
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          {selectedEventId === event.id && (
                                            <Ionicons name="checkmark" size={12} color="#ffffff" />
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
                                            {new Date(event.date).toLocaleDateString("en-US", {
                                              weekday: "long",
                                              year: "numeric",
                                              month: "long",
                                              day: "numeric",
                                            })}
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
                    onPress={handleUpload}
                    disabled={!canUpload}
                    action="primary"
                    variant="solid"
                    size="lg"
                    className="h-14 cursor-pointer rounded-2xl"
                    style={{
                      backgroundColor: canUpload
                        ? theme.buttonPrimary
                        : theme.textTertiary,
                      shadowColor: canUpload ? theme.buttonPrimary : "transparent",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: canUpload ? 0.3 : 0,
                      shadowRadius: 8,
                      elevation: canUpload ? 4 : 0,
                    }}
                  >
                    {isUploading ? (
                      <HStack className="items-center gap-2">
                        <ActivityIndicator size="small" color="#ffffff" />
                        <ButtonText
                          className="text-base font-semibold"
                          style={{ color: "#ffffff" }}
                        >
                          {t("teams.documents.uploading")}
                        </ButtonText>
                      </HStack>
                    ) : (
                      <ButtonText
                        className="text-base font-semibold"
                        style={{ color: "#ffffff" }}
                      >
                        {t("teams.documents.uploadDocument")}
                      </ButtonText>
                    )}
                  </Button>
                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={isUploading}
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
