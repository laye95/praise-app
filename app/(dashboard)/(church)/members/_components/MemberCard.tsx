import { TouchableOpacity, Pressable } from "react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { User } from "@/types/user";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as Haptics from "expo-haptics";

interface MemberCardProps {
  member: User;
  roleNames?: string[];
  onPress?: () => void;
  onLongPress?: (event: { nativeEvent: { pageX: number; pageY: number } }) => void;
  highlighted?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export function MemberCard({ 
  member, 
  roleNames = [], 
  onPress, 
  onLongPress, 
  highlighted = false,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}: MemberCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const translateRoleName = (roleName: string): string => {
    const roleMap: Record<string, string> = {
      "Pastor": t("members.roles.pastor"),
      "Member": t("members.roles.member"),
      "Admin": t("members.roles.admin"),
      "Leader": t("members.roles.leader"),
      "Team Member": t("members.roles.teamMember"),
      "Visitor": t("members.roles.visitor"),
    };
    return roleMap[roleName] || roleName;
  };

  const getRoleBadge = (roleName: string) => {
    const roleConfig: Record<string, { color: string; bg: string }> = {
      Pastor: {
        color: isDark ? "#a5b4fc" : "#6366f1",
        bg: theme.avatarPrimary,
      },
      Member: {
        color: isDark ? "#93c5fd" : "#0284c7",
        bg: theme.badgeInfo,
      },
    };

    const config = roleConfig[roleName] || {
      color: isDark ? "#93c5fd" : "#0284c7",
      bg: theme.badgeInfo,
    };

    return (
      <Box
        style={{
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
          backgroundColor: config.bg,
        }}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: "600",
            color: config.color,
            letterSpacing: 0.3,
          }}
        >
          {translateRoleName(roleName)}
        </Text>
      </Box>
    );
  };

  const getAvatarBgColor = () => {
    if (roleNames.length === 0) {
      return theme.avatarPrimary;
    }

    const primaryRole = roleNames[0];
    const roleConfig: Record<string, string> = {
      Pastor: theme.avatarPrimary,
      Member: theme.badgeInfo,
    };

    return roleConfig[primaryRole] || theme.avatarPrimary;
  };

  const getInitials = () => {
    if (member.full_name) {
      const names = member.full_name.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return member.full_name.substring(0, 2).toUpperCase();
    }
    return member.email?.substring(0, 2).toUpperCase() || "U";
  };

  const cardBg = theme.cardBg;
  const cardBorder = theme.cardBorder;
  const textPrimary = theme.textPrimary;
  const textSecondary = theme.textSecondary;
  const avatarBg = getAvatarBgColor();
  const avatarText = isDark ? "#ffffff" : theme.buttonPrimary;

  const CardContent = (
    <Box
      style={{
        borderRadius: 12,
        backgroundColor: highlighted ? (isDark ? "#1e3a5f" : "#eff6ff") : cardBg,
        padding: 12,
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.pageBg === "#0f172a" ? 0.3 : 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: highlighted ? 2 : 1,
        borderColor: highlighted ? theme.buttonPrimary : cardBorder,
      }}
    >
      <HStack className="items-center gap-2.5">
        {isSelectionMode && onToggleSelect ? (
          <TouchableOpacity
            onPress={onToggleSelect}
            activeOpacity={0.7}
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: isSelected ? theme.buttonPrimary : theme.cardBorder,
              backgroundColor: isSelected ? theme.buttonPrimary : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isSelected && (
              <Ionicons name="checkmark" size={16} color="#ffffff" />
            )}
          </TouchableOpacity>
        ) : (
          <Box
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: avatarBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: avatarText,
              }}
            >
              {getInitials()}
            </Text>
          </Box>
        )}
        <VStack className="flex-1 gap-0.5">
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: textPrimary,
              lineHeight: 20,
            }}
          >
            {member.full_name || member.email?.split("@")[0] || "No name"}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: textSecondary,
              lineHeight: 18,
            }}
          >
            {member.email}
          </Text>
        </VStack>
        <HStack className="items-center gap-2">
          {roleNames.length > 0 && (
            <HStack className="gap-1.5">
              {roleNames.slice(0, 2).map((roleName) => (
                <Box key={roleName}>
                  {getRoleBadge(roleName)}
                </Box>
              ))}
            </HStack>
          )}
          {onPress && (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.textTertiary}
            />
          )}
        </HStack>
      </HStack>
    </Box>
  );

  const handleLongPress = (event: { nativeEvent: { pageX: number; pageY: number } }) => {
    if (onLongPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onLongPress(event);
    }
  };

  if (isSelectionMode && onToggleSelect) {
    return (
      <Pressable
        onPress={onToggleSelect}
        className="cursor-pointer"
      >
        {CardContent}
      </Pressable>
    );
  }

  if (onPress || onLongPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress ? handleLongPress : undefined}
        delayLongPress={300}
        className="cursor-pointer"
      >
        {CardContent}
      </Pressable>
    );
  }

  return CardContent;
}
