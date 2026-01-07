import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { usePermissions } from "@/hooks/usePermissions";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Linking, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DeleteConfirmationDialog } from "../../../members/_components/DeleteConfirmationDialog";
import { useTeam } from "../../_hooks/useTeam";
import { useTeamCalendar } from "../calendar/_hooks/useTeamCalendar";
import { DocumentFilterDrawer } from "./_components/DocumentFilterDrawer";
import { UploadDocumentModal } from "./_components/UploadDocumentModal";
import { useTeamDocuments } from "./_hooks/useTeamDocuments";

export default function DocumentsScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.pageBg === "#0f172a";
  const { can, hasRole } = usePermissions();
  const { team, isLeader } = useTeam(teamId);
  const {
    documents,
    isLoading,
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
    isUploading,
    isDeleting,
  } = useTeamDocuments(teamId);
  const { events } = useTeamCalendar(teamId);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(
    undefined,
  );

  const isPastor = hasRole("Pastor");
  const canDeleteDocuments = isPastor || isLeader;

  const filteredDocuments = useMemo(() => {
    if (!selectedEventId) return documents;
    return documents.filter((doc) => doc.event_id === selectedEventId);
  }, [documents, selectedEventId]);

  const handleViewDocument = async (documentId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const url = await getDocumentUrl(documentId);
      if (url) {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        }
      }
    } catch (error) {
      console.error("Failed to open document:", error);
    }
  };

  const handleDeleteDocument = async () => {
    if (selectedDocumentId) {
      await deleteDocument(selectedDocumentId);
      setShowDeleteDialog(false);
      setSelectedDocumentId(null);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: theme.pageBg }}
      >
        <Box className="items-center justify-center py-20">
          <Text className="text-base" style={{ color: theme.textSecondary }}>
            {t("teams.documents.loading")}
          </Text>
        </Box>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box className="px-6 py-4">
          <VStack className="gap-6">
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
                {events.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowFilterDrawer(true);
                    }}
                    activeOpacity={0.7}
                    className="cursor-pointer"
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: selectedEventId
                        ? theme.buttonPrimary
                        : isDark
                          ? "#1e293b"
                          : "#f8fafc",
                      borderWidth: 1,
                      borderColor: selectedEventId
                        ? theme.buttonPrimary
                        : theme.cardBorder,
                    }}
                  >
                    <HStack className="items-center gap-2">
                      <Ionicons
                        name="filter"
                        size={18}
                        color={
                          selectedEventId
                            ? "#ffffff"
                            : theme.textPrimary
                        }
                      />
                      {selectedEventId && (
                        <Box
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: "#ffffff",
                          }}
                        />
                      )}
                    </HStack>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowUploadModal(true);
                  }}
                  activeOpacity={0.7}
                  className="cursor-pointer"
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: theme.buttonPrimary,
                  }}
                >
                  <HStack className="items-center gap-2">
                    <Ionicons name="add" size={18} color="#ffffff" />
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: "#ffffff" }}
                    >
                      {t("teams.documents.uploadDocument")}
                    </Text>
                  </HStack>
                </TouchableOpacity>
              </HStack>
            </HStack>

            {selectedEventId && (
              <Box
                className="mb-4 rounded-xl p-3"
                style={{
                  backgroundColor: isDark ? "#1e3a5f" : "#dbeafe",
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                }}
              >
                <HStack className="items-center justify-between">
                  <HStack className="items-center gap-2 flex-1">
                    <Ionicons
                      name="calendar"
                      size={18}
                      color={theme.buttonPrimary}
                    />
                    <VStack className="flex-1">
                      <Text
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: theme.textSecondary }}
                      >
                        {t("teams.documents.filteredBy")}
                      </Text>
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: theme.textPrimary }}
                      >
                        {events.find((e) => e.id === selectedEventId)?.title ||
                          ""}
                      </Text>
                    </VStack>
                  </HStack>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedEventId(undefined);
                    }}
                    activeOpacity={0.7}
                    className="cursor-pointer"
                    style={{
                      padding: 4,
                    }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </HStack>
              </Box>
            )}

            {filteredDocuments.length === 0 ? (
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
                    name="document-outline"
                    size={48}
                    color={theme.textTertiary}
                  />
                </Box>
                <Text
                  className="mb-2 text-xl font-bold"
                  style={{ color: theme.textPrimary }}
                >
                  {t("teams.documents.noDocuments")}
                </Text>
                <Text
                  className="max-w-xs text-center text-sm"
                  style={{ color: theme.textSecondary }}
                >
                  {t("teams.documents.noDocumentsDescription")}
                </Text>
              </Box>
            ) : (
              <VStack className="gap-3">
                {filteredDocuments.map((document) => {
                  const event = events.find((e) => e.id === document.event_id);
                  return (
                    <Box
                      key={document.id}
                      className="rounded-2xl p-4"
                      style={{
                        backgroundColor: theme.cardBg,
                        borderWidth: 1,
                        borderColor: theme.cardBorder,
                      }}
                    >
                      <HStack className="items-center justify-between">
                        <HStack className="flex-1 items-center gap-3">
                          <Box
                            className="rounded-xl p-3"
                            style={{
                              backgroundColor: isDark ? "#1e293b" : "#fef2f2",
                            }}
                          >
                            <Ionicons
                              name="document-text"
                              size={24}
                              color={isDark ? "#f87171" : "#ef4444"}
                            />
                          </Box>
                          <VStack className="flex-1 gap-1">
                            <Text
                              className="text-base font-semibold"
                              style={{ color: theme.textPrimary }}
                            >
                              {document.file_name}
                            </Text>
                            {event && (
                              <Text
                                className="text-xs"
                                style={{ color: theme.textSecondary }}
                              >
                                {event.title} -{" "}
                                {new Date(event.date).toLocaleDateString()}
                              </Text>
                            )}
                            {document.file_size && (
                              <Text
                                className="text-xs"
                                style={{ color: theme.textSecondary }}
                              >
                                {(document.file_size / 1024 / 1024).toFixed(2)}{" "}
                                MB
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                        <HStack className="items-center gap-2">
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleViewDocument(document.id)}
                            className="cursor-pointer"
                            style={{
                              padding: 8,
                              borderRadius: 8,
                              backgroundColor: theme.buttonPrimary,
                            }}
                          >
                            <Ionicons
                              name="eye-outline"
                              size={20}
                              color="#ffffff"
                            />
                          </TouchableOpacity>
                          {canDeleteDocuments && (
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => {
                                Haptics.impactAsync(
                                  Haptics.ImpactFeedbackStyle.Light,
                                );
                                setSelectedDocumentId(document.id);
                                setShowDeleteDialog(true);
                              }}
                              className="cursor-pointer"
                              style={{
                                padding: 8,
                                borderRadius: 8,
                                backgroundColor: isDark ? "#7f1d1d" : "#fef2f2",
                              }}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={20}
                                color={isDark ? "#f87171" : "#ef4444"}
                              />
                            </TouchableOpacity>
                          )}
                        </HStack>
                      </HStack>
                    </Box>
                  );
                })}
              </VStack>
            )}
          </VStack>
        </Box>
      </ScrollView>

      {showUploadModal && (
        <UploadDocumentModal
          visible={showUploadModal}
          teamId={teamId}
          events={events}
          onClose={() => setShowUploadModal(false)}
          onUpload={async (fileUri, fileName, eventId) => {
            await uploadDocument({ fileUri, fileName, eventId });
            setShowUploadModal(false);
          }}
          isUploading={isUploading}
        />
      )}

      <DocumentFilterDrawer
        visible={showFilterDrawer}
        events={events}
        selectedEventId={selectedEventId}
        onClose={() => setShowFilterDrawer(false)}
        onApply={(eventId) => {
          setSelectedEventId(eventId);
        }}
      />

      <DeleteConfirmationDialog
        visible={showDeleteDialog}
        title={t("teams.documents.deleteDocument")}
        message={t("teams.documents.deleteDocumentConfirm")}
        onConfirm={handleDeleteDocument}
        onCancel={() => {
          setShowDeleteDialog(false);
          setSelectedDocumentId(null);
        }}
        isDeleting={isDeleting}
      />
    </SafeAreaView>
  );
}
