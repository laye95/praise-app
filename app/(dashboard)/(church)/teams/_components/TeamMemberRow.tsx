import { TouchableOpacity } from "react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { TeamMemberWithUser, TeamMemberRole } from "@/types/team";
import { User } from "@/types/user";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface TeamMemberRowProps {
  member: TeamMemberWithUser;
  currentUserId?: string;
  canManage?: boolean;
  canEditPosition?: boolean;
  onRemove?: (userId: string) => void;
  onUpdateRole?: (userId: string, role: TeamMemberRole) => void;
  onUpdatePosition?: (userId: string, position?: string) => void;
  onPress?: () => void;
  isRemoving?: boolean;
}

export function TeamMemberRow({
  member,
  currentUserId,
  canManage = false,
  canEditPosition = false,
  onRemove,
  onUpdateRole,
  onUpdatePosition,
  onPress,
  isRemoving = false,
}: TeamMemberRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isCurrentUser = currentUserId === member.user_id;
  const canRemove = canManage && !isCurrentUser;

  const getInitials = (name?: string, email?: string): string => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "??";
  };

  const initials = getInitials(member.user.full_name, member.user.email);
  const displayName =
    member.user.full_name || member.user.email.split("@")[0];

  return (
    <TouchableOpacity
      activeOpacity={canEditPosition ? 0.7 : 1}
      onPress={canEditPosition ? onPress : undefined}
      disabled={!canEditPosition}
    >
      <Box
        className="rounded-xl p-4 mb-3"
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
      <HStack className="items-center justify-between">
        <HStack className="items-center gap-3 flex-1">
          <Box
            className="rounded-xl"
            style={{
              width: 48,
              height: 48,
              backgroundColor: theme.avatarPrimary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              className="text-base font-semibold"
              style={{ color: isDark ? "#ffffff" : theme.buttonPrimary }}
            >
              {initials}
            </Text>
          </Box>
          <VStack className="flex-1 gap-0.5">
            <HStack className="items-center gap-2">
              <Text
                className="text-base font-semibold"
                style={{ color: theme.textPrimary }}
              >
                {displayName}
              </Text>
              {isCurrentUser && (
                <Text
                  className="text-xs"
                  style={{ color: theme.textSecondary }}
                >
                  ({t("teams.you")})
                </Text>
              )}
            </HStack>
            {member.user.full_name && (
              <Text
                className="text-sm"
                style={{ color: theme.textSecondary }}
              >
                {member.user.email}
              </Text>
            )}
            {member.position && (
              <HStack className="items-center gap-1 mt-0.5">
                <Ionicons
                  name="musical-notes"
                  size={12}
                  color={theme.textSecondary}
                />
                <Text
                  className="text-xs"
                  style={{ color: theme.textSecondary }}
                >
                  {member.position}
                </Text>
              </HStack>
            )}
          </VStack>
        </HStack>
        <HStack className="items-center gap-3">
          <Box
            className="rounded px-2 py-1"
            style={{
              backgroundColor:
                member.role === "admin"
                  ? theme.badgeWarning
                  : theme.badgeInfo,
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{
                color:
                  member.role === "admin"
                    ? isDark
                      ? "#ffffff"
                      : "#92400e"
                    : isDark
                    ? "#ffffff"
                    : "#2563eb",
              }}
            >
              {member.role === "admin"
                ? t("teams.admin")
                : t("teams.member")}
            </Text>
          </Box>
          {canRemove && (
            <TouchableOpacity
              onPress={() => onRemove?.(member.user_id)}
              disabled={isRemoving}
              activeOpacity={0.7}
              className="cursor-pointer"
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={isRemoving ? theme.textTertiary : "#dc2626"}
              />
            </TouchableOpacity>
          )}
        </HStack>
      </HStack>
    </Box>
    </TouchableOpacity>
  );
}
