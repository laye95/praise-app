import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamCalendarService } from "@/services/api/teamCalendarService";
import { queryKeys } from "@/services/queryKeys";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { AppError } from "@/services/api/baseService";
import {
  CreateCalendarEventData,
  UpdateCalendarEventData,
} from "@/types/teamCalendar";
import * as Haptics from "expo-haptics";

export function useTeamCalendar(teamId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  const eventsQuery = useQuery({
    queryKey: queryKeys.teamCalendar.events(teamId),
    queryFn: () => teamCalendarService.getCalendarEvents(teamId),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 2,
  });

  const searchEvents = (searchQuery: string) => {
    return useQuery({
      queryKey: queryKeys.teamCalendar.search(teamId, searchQuery),
      queryFn: () => teamCalendarService.getCalendarEvents(teamId, undefined, undefined, searchQuery),
      enabled: !!teamId && !!searchQuery && searchQuery.trim().length > 0,
      staleTime: 1000 * 60 * 2,
    });
  };

  const getEventsByDateRange = (startDate: string, endDate: string) => {
    return useQuery({
      queryKey: queryKeys.teamCalendar.byDateRange(teamId, startDate, endDate),
      queryFn: () =>
        teamCalendarService.getCalendarEvents(teamId, startDate, endDate),
      enabled: !!teamId && !!startDate && !!endDate,
      staleTime: 1000 * 60 * 2,
    });
  };

  const createEventMutation = useMutation({
    mutationFn: async (data: CreateCalendarEventData) => {
      return teamCalendarService.createCalendarEvent(teamId, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teamCalendar.events(teamId),
      });
      toast.show({
        title: t("teams.calendar.eventCreated"),
        description: t("teams.calendar.eventCreatedDescription"),
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = t("teams.calendar.createEventFailed");
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

  const updateEventMutation = useMutation({
    mutationFn: async ({
      eventId,
      data,
    }: {
      eventId: string;
      data: UpdateCalendarEventData;
    }) => {
      return teamCalendarService.updateCalendarEvent(eventId, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teamCalendar.events(teamId),
      });
      toast.show({
        title: t("teams.calendar.eventUpdated"),
        description: t("teams.calendar.eventUpdatedDescription"),
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = t("teams.calendar.updateEventFailed");
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

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return teamCalendarService.deleteCalendarEvent(eventId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teamCalendar.events(teamId),
      });
      toast.show({
        title: t("teams.calendar.eventDeleted"),
        description: t("teams.calendar.eventDeletedDescription"),
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = t("teams.calendar.deleteEventFailed");
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

  return {
    events: eventsQuery.data || [],
    isLoading: eventsQuery.isLoading,
    createEvent: createEventMutation.mutate,
    updateEvent: updateEventMutation.mutate,
    deleteEvent: deleteEventMutation.mutate,
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending,
    getEventsByDateRange,
  };
}
