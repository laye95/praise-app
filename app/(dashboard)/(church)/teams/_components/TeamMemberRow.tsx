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

interface TeamMemberRowProps {
  member: TeamMemberWithUser;
  currentUserId?: string;
  canManage?: boolean;
  onRemove?: (userId: string) => void;
  onUpdateRole?: (userId: string, role: TeamMemberRole) => void;
  isRemoving?: boolean;
}

export function TeamMemberRow({
  member,
  currentUserId,
  canManage = false,
  onRemove,
  onUpdateRole,
  isRemoving = false,
}: TeamMemberRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.pageBg === "#0f172a";
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
              style={{ color: theme.buttonPrimary }}
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
          </VStack>
        </HStack>
        <HStack className="items-center gap-3">
          <Box
            className="rounded px-2 py-1"
            style={{
              backgroundColor:
                member.role === "leader"
                  ? theme.badgeWarning
                  : theme.badgeInfo,
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: "#ffffff" }}
            >
              {member.role === "leader"
                ? t("teams.leader")
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
  );
}
