import { TouchableOpacity } from "react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { Team } from "@/types/team";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface TeamCardProps {
  team: Team;
  memberCount?: number;
  onPress?: () => void;
}

export function TeamCard({ team, memberCount = 0, onPress }: TeamCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.pageBg === "#0f172a";

  const getTeamTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      worship: "musical-notes",
      prayer: "heart",
      hospitality: "people",
      media: "videocam",
      kids: "happy",
      youth: "school",
      outreach: "hand-left",
      other: "grid",
    };
    return iconMap[type] || "grid";
  };

  const getTeamTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      worship: isDark ? "#a5b4fc" : "#6366f1",
      prayer: isDark ? "#f87171" : "#ef4444",
      hospitality: isDark ? "#34d399" : "#10b981",
      media: isDark ? "#60a5fa" : "#3b82f6",
      kids: isDark ? "#fbbf24" : "#f59e0b",
      youth: isDark ? "#a78bfa" : "#8b5cf6",
      outreach: isDark ? "#fb7185" : "#f43f5e",
      other: isDark ? "#94a3b8" : "#64748b",
    };
    return colorMap[type] || (isDark ? "#94a3b8" : "#64748b");
  };

  const getTeamTypeBg = (type: string) => {
    const bgMap: Record<string, string> = {
      worship: isDark ? "#312e81" : "#eef2ff",
      prayer: isDark ? "#7f1d1d" : "#fef2f2",
      hospitality: isDark ? "#064e3b" : "#f0fdf4",
      media: isDark ? "#1e3a8a" : "#eff6ff",
      kids: isDark ? "#78350f" : "#fef3c7",
      youth: isDark ? "#581c87" : "#f3e8ff",
      outreach: isDark ? "#831843" : "#fdf2f8",
      other: isDark ? "#1e293b" : "#f1f5f9",
    };
    return bgMap[type] || (isDark ? "#1e293b" : "#f1f5f9");
  };

  const iconName = getTeamTypeIcon(team.type);
  const iconColor = getTeamTypeColor(team.type);
  const iconBg = getTeamTypeBg(team.type);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="cursor-pointer"
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
        <HStack className="items-center gap-4">
          <Box
            className="rounded-xl p-3"
            style={{ backgroundColor: iconBg }}
          >
            <Ionicons name={iconName} size={24} color={iconColor} />
          </Box>
          <VStack className="flex-1 gap-1">
            <HStack className="items-center justify-between">
              <Text
                className="text-base font-bold"
                style={{ color: theme.textPrimary }}
              >
                {team.name}
              </Text>
              <Box
                className="rounded px-2 py-0.5"
                style={{ backgroundColor: theme.badgeInfo }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: isDark ? "#ffffff" : "#2563eb" }}
                >
                  {t(`teams.types.${team.type}`)}
                </Text>
              </Box>
            </HStack>
            {team.description && (
              <Text
                className="text-sm"
                style={{ color: theme.textSecondary }}
                numberOfLines={2}
              >
                {team.description}
              </Text>
            )}
            <HStack className="items-center gap-2 mt-1">
              <Ionicons
                name="people-outline"
                size={14}
                color={theme.textTertiary}
              />
              <Text
                className="text-xs"
                style={{ color: theme.textTertiary }}
              >
                {memberCount} {memberCount === 1 ? t("teams.member") : t("teams.members")}
              </Text>
            </HStack>
          </VStack>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.textTertiary}
          />
        </HStack>
      </Box>
    </TouchableOpacity>
  );
}
