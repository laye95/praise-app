import { TouchableOpacity } from "react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Ionicons } from "@expo/vector-icons";
import { MembershipRequestWithUser } from "@/types/membership";
import { ActivityIndicator } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface InvitationCardProps {
  invitation: MembershipRequestWithUser;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  isAccepting: boolean;
  isDeclining: boolean;
}

export function InvitationCard({
  invitation,
  onAccept,
  onDecline,
  isAccepting,
  isDeclining,
}: InvitationCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const getStatusBadge = () => {
    const statusConfig: Record<
      string,
      { color: string; bg: string; label: string; icon: keyof typeof Ionicons.glyphMap }
    > = {
      pending: {
        color: isDark ? "#fbbf24" : "#d97706",
        bg: isDark ? "rgba(251, 191, 36, 0.15)" : "rgba(217, 119, 6, 0.1)",
        label: t("members.status.pending"),
        icon: "time-outline",
      },
      accepted: {
        color: isDark ? "#34d399" : "#059669",
        bg: isDark ? "rgba(52, 211, 153, 0.15)" : "rgba(5, 150, 105, 0.1)",
        label: t("members.status.accepted"),
        icon: "checkmark-circle",
      },
      declined: {
        color: isDark ? "#f87171" : "#dc2626",
        bg: isDark ? "rgba(248, 113, 113, 0.15)" : "rgba(220, 38, 38, 0.1)",
        label: t("members.status.declined"),
        icon: "close-circle",
      },
      cancelled: {
        color: theme.textTertiary,
        bg: theme.emptyBg,
        label: t("members.status.cancelled"),
        icon: "ban-outline",
      },
    };

    const config = statusConfig[invitation.status] || statusConfig.pending;

    return (
      <HStack
        className="items-center gap-1.5"
        style={{
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 8,
          backgroundColor: config.bg,
        }}
      >
        <Ionicons name={config.icon} size={14} color={config.color} />
        <Text
          style={{
            fontSize: 11,
            fontWeight: "600",
            color: config.color,
            letterSpacing: 0.3,
          }}
        >
          {config.label}
        </Text>
      </HStack>
    );
  };

  const getInitials = () => {
    const name = invitation.user?.full_name || invitation.user?.email?.split("@")[0] || "U";
    if (invitation.user?.full_name) {
      const names = invitation.user.full_name.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return invitation.user.full_name.substring(0, 2).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const canAction = invitation.status === "pending";

  const displayName =
    invitation.user?.full_name ||
    invitation.user?.email?.split("@")[0] ||
    t("members.invitations.unknownUser");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t("members.invitations.today");
    if (diffDays === 1) return t("members.invitations.yesterday");
    if (diffDays < 7) return t("members.invitations.daysAgo", { count: diffDays });
    
    const locale = t("members.invitations.today") === "Vandaag" ? "nl-NL" : "en-US";
    return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
  };

  const avatarBg = isDark ? "rgba(251, 191, 36, 0.2)" : "rgba(217, 119, 6, 0.15)";
  const avatarText = isDark ? "#fbbf24" : "#d97706";

  return (
    <Box
      style={{
        borderRadius: 16,
        backgroundColor: theme.cardBg,
        padding: 20,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.25 : 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: theme.cardBorder,
      }}
    >
      <HStack className="items-start gap-4 mb-5">
        <Box
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            backgroundColor: avatarBg,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: avatarText,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: avatarText,
            }}
          >
            {getInitials()}
          </Text>
        </Box>
        <VStack className="flex-1 gap-2">
          <HStack className="items-start justify-between flex-wrap">
            <VStack className="flex-1 gap-1">
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: theme.textPrimary,
                  lineHeight: 24,
                }}
              >
                {displayName}
              </Text>
              <HStack className="items-center gap-2">
                <Ionicons name="mail-outline" size={14} color={theme.textSecondary} />
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.textSecondary,
                    lineHeight: 20,
                  }}
                >
                  {invitation.user?.email}
                </Text>
              </HStack>
            </VStack>
            {getStatusBadge()}
          </HStack>
          
          <HStack className="items-center gap-1.5">
            <Ionicons name="time-outline" size={12} color={theme.textTertiary} />
            <Text
              style={{
                fontSize: 12,
                color: theme.textTertiary,
                fontWeight: "500",
              }}
            >
              {formatDate(invitation.created_at)}
            </Text>
          </HStack>

          {invitation.message && (
            <Box
              style={{
                marginTop: 4,
                padding: 14,
                backgroundColor: isDark ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.05)",
                borderRadius: 12,
                borderLeftWidth: 3,
                borderLeftColor: theme.buttonPrimary,
              }}
            >
              <HStack className="items-start gap-2 mb-1">
                <Ionicons name="chatbubble-outline" size={14} color={theme.buttonPrimary} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: theme.buttonPrimary,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {t("members.invitations.message")}
                </Text>
              </HStack>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.textPrimary,
                  lineHeight: 20,
                  marginTop: 4,
                }}
              >
                {invitation.message}
              </Text>
            </Box>
          )}
        </VStack>
      </HStack>

      {canAction && (
        <Box
          style={{
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: theme.cardBorder,
          }}
        >
          <HStack className="gap-3">
            <TouchableOpacity
              onPress={() => !isAccepting && !isDeclining && onAccept(invitation.id)}
              disabled={isAccepting || isDeclining}
              activeOpacity={0.8}
              className="flex-1 cursor-pointer"
              style={{
                borderRadius: 12,
                paddingVertical: 14,
                paddingHorizontal: 16,
                backgroundColor: isDark ? "#059669" : "#10b981",
                shadowColor: isDark ? "#059669" : "#10b981",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 2,
                opacity: (isAccepting || isDeclining) ? 0.6 : 1,
              }}
            >
              {isAccepting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <HStack className="items-center justify-center gap-2">
                  <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 15,
                      fontWeight: "600",
                    }}
                  >
                    {t("members.invitations.accept")}
                  </Text>
                </HStack>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => !isAccepting && !isDeclining && onDecline(invitation.id)}
              disabled={isAccepting || isDeclining}
              activeOpacity={0.8}
              className="flex-1 cursor-pointer"
              style={{
                borderRadius: 12,
                paddingVertical: 14,
                paddingHorizontal: 16,
                backgroundColor: isDark ? "#dc2626" : "#ef4444",
                shadowColor: isDark ? "#dc2626" : "#ef4444",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 2,
                opacity: (isAccepting || isDeclining) ? 0.6 : 1,
              }}
            >
              {isDeclining ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <HStack className="items-center justify-center gap-2">
                  <Ionicons name="close-circle" size={18} color="#ffffff" />
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 15,
                      fontWeight: "600",
                    }}
                  >
                    {t("members.invitations.decline")}
                  </Text>
                </HStack>
              )}
            </TouchableOpacity>
          </HStack>
        </Box>
      )}
    </Box>
  );
}
