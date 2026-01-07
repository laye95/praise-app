import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamDocumentService } from "@/services/api/teamDocumentService";
import { queryKeys } from "@/services/queryKeys";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { AppError } from "@/services/api/baseService";
import * as Haptics from "expo-haptics";

export function useTeamDocuments(teamId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  const documentsQuery = useQuery({
    queryKey: queryKeys.teamDocuments.all(teamId),
    queryFn: () => teamDocumentService.getDocuments(teamId),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5,
  });

  const getDocumentsByEvent = (eventId: string) => {
    return useQuery({
      queryKey: queryKeys.teamDocuments.byEvent(teamId, eventId),
      queryFn: () => teamDocumentService.getDocuments(teamId, eventId),
      enabled: !!teamId && !!eventId,
      staleTime: 1000 * 60 * 5,
    });
  };

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({
      fileUri,
      fileName,
      eventId,
    }: {
      fileUri: string;
      fileName: string;
      eventId?: string;
    }) => {
      return teamDocumentService.uploadDocument(teamId, fileUri, fileName, eventId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teamDocuments.all(teamId),
      });
      toast.show({
        title: t("teams.documents.documentUploaded"),
        description: t("teams.documents.documentUploadedDescription"),
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = t("teams.documents.uploadFailed");
      if (err instanceof AppError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.show({
        title: t("common.error"),
        description: errorMessage,
        action: "error",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return teamDocumentService.deleteDocument(documentId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teamDocuments.all(teamId),
      });
      toast.show({
        title: t("teams.documents.documentDeleted"),
        description: t("teams.documents.documentDeletedDescription"),
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = t("teams.documents.deleteFailed");
      if (err instanceof AppError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.show({
        title: t("common.error"),
        description: errorMessage,
        action: "error",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const getDocumentUrlMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return teamDocumentService.getDocumentUrl(documentId);
    },
  });

  return {
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    uploadDocument: uploadDocumentMutation.mutate,
    deleteDocument: deleteDocumentMutation.mutate,
    getDocumentUrl: getDocumentUrlMutation.mutateAsync,
    isUploading: uploadDocumentMutation.isPending,
    isDeleting: deleteDocumentMutation.isPending,
    isGettingUrl: getDocumentUrlMutation.isPending,
    getDocumentsByEvent,
  };
}
