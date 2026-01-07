import { TouchableOpacity } from "react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useTheme } from "@/hooks/useTheme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { TeamGroup } from "@/types/team";
import { Ionicons } from "@expo/vector-icons";

interface GroupCardProps {
  group: TeamGroup;
  memberCount?: number;
  onPress: () => void;
}

export function GroupCard({ group, memberCount = 0, onPress }: GroupCardProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="cursor-pointer"
    >
      <Box
        className="rounded-2xl p-4"
        style={{
          backgroundColor: theme.cardBg,
          borderWidth: 1,
          borderColor: theme.cardBorder,
        }}
      >
        <HStack className="items-center justify-between">
          <HStack className="items-center gap-3 flex-1">
            <Box
              className="rounded-xl p-3"
              style={{
                backgroundColor: isDark ? "#1e3a5f" : "#dbeafe",
              }}
            >
              <Ionicons name="people" size={24} color={theme.buttonPrimary} />
            </Box>
            <VStack className="flex-1 gap-1">
              <Text
                className="text-base font-semibold"
                style={{ color: theme.textPrimary }}
              >
                {group.name}
              </Text>
              <Text
                className="text-sm"
                style={{ color: theme.textSecondary }}
              >
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </Text>
            </VStack>
          </HStack>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.textTertiary}
          />
        </HStack>
      </Box>
    </TouchableOpacity>
  );
}
