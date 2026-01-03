import { ReactNode } from "react";
import { Box } from "./box";
import { HStack } from "./hstack";
import { VStack } from "./vstack";
import { Text } from "./text";
import { Ionicons } from "@expo/vector-icons";

interface SectionHeaderProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionHeader({
  icon,
  iconColor = "#6366f1",
  iconBgColor = "bg-primary-100",
  title,
  subtitle,
  action,
}: SectionHeaderProps) {
  return (
    <HStack className="items-center justify-between mb-4">
      <HStack className="items-center gap-3 flex-1">
        {icon && (
          <Box className={`rounded-xl ${iconBgColor} p-3`}>
            <Ionicons name={icon} size={24} color={iconColor} />
          </Box>
        )}
        <VStack className="flex-1">
          <Text className="text-lg font-bold text-typography-950">{title}</Text>
          {subtitle && (
            <Text className="text-sm text-typography-600">{subtitle}</Text>
          )}
        </VStack>
      </HStack>
      {action && <Box>{action}</Box>}
    </HStack>
  );
}
