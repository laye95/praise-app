import { useEffect, useRef } from "react";
import { Modal, TouchableOpacity, Animated, Dimensions, Platform } from "react-native";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { User } from "@/types/user";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import * as Haptics from "expo-haptics";

interface MemberActionPopoverProps {
  visible: boolean;
  member: User | null;
  anchorPosition: { x: number; y: number } | null;
  currentUserId?: string;
  onClose: () => void;
  onRemoveMember: (memberId: string) => void;
  onChangeRole: (memberId: string) => void;
  isRemoving: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const POPOVER_WIDTH = 160;
const POPOVER_PADDING = 8;

export function MemberActionPopover({
  visible,
  member,
  anchorPosition,
  currentUserId,
  onClose,
  onRemoveMember,
  onChangeRole,
  isRemoving,
}: MemberActionPopoverProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.pageBg === "#0f172a";
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && anchorPosition) {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 300,
          friction: 30,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, anchorPosition, scaleAnim, opacityAnim]);

  if (!visible || !member || !anchorPosition) {
    return null;
  }

  const isCurrentUser = currentUserId === member.id;

  if (isCurrentUser) {
    return null;
  }

  const handleRemoveMember = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemoveMember(member.id);
    onClose();
  };

  const handleChangeRole = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeRole(member.id);
    onClose();
  };

  const popoverX = Math.max(
    POPOVER_PADDING,
    Math.min(
      anchorPosition.x - POPOVER_WIDTH / 2,
      SCREEN_WIDTH - POPOVER_WIDTH - POPOVER_PADDING,
    ),
  );

  const popoverHeight = 110;
  const spaceAbove = anchorPosition.y;
  const spaceBelow = SCREEN_HEIGHT - anchorPosition.y;

  let popoverY: number;
  if (spaceAbove > popoverHeight + 20) {
    popoverY = anchorPosition.y - popoverHeight - 10;
  } else if (spaceBelow > popoverHeight + 20) {
    popoverY = anchorPosition.y + 60;
  } else {
    popoverY = Math.max(
      POPOVER_PADDING,
      SCREEN_HEIGHT - popoverHeight - POPOVER_PADDING,
    );
  }

  const scale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={{ flex: 1 }}
        onPress={onClose}
      >
        <Animated.View
          style={{
            position: "absolute",
            left: popoverX,
            top: popoverY,
            width: POPOVER_WIDTH,
            opacity: opacityAnim,
            transform: [{ scale }],
          }}
        >
          <Box
            className="rounded-xl"
            style={{
              backgroundColor: theme.cardBg,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.5 : 0.15,
              shadowRadius: 12,
              elevation: 8,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              overflow: "hidden",
            }}
          >
            <VStack className="gap-0 p-1.5">
              {!isCurrentUser && (
                <>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleChangeRole}
                    className="cursor-pointer"
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 10,
                      borderRadius: 8,
                    }}
                  >
                    <HStack className="items-center gap-2.5">
                      <Box
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          backgroundColor: theme.avatarPrimary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons
                          name="person-outline"
                          size={16}
                          color={isDark ? "#94a3b8" : "#475569"}
                        />
                      </Box>
                      <Text
                        className="text-sm font-semibold flex-1"
                        style={{ color: theme.textPrimary }}
                      >
                        {t("members.profile.changeRole")}
                      </Text>
                    </HStack>
                  </TouchableOpacity>

                  <Box
                    style={{
                      height: 1,
                      backgroundColor: theme.cardBorder,
                      marginVertical: 2,
                    }}
                  />

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleRemoveMember}
                    disabled={isRemoving}
                    className="cursor-pointer"
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 10,
                      borderRadius: 8,
                      opacity: isRemoving ? 0.5 : 1,
                    }}
                  >
                    <HStack className="items-center gap-2.5">
                      <Box
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          backgroundColor: isDark ? "#991b1b" : "#fee2e2",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color={isDark ? "#fca5a5" : "#dc2626"}
                        />
                      </Box>
                      <Text
                        className="text-sm font-semibold flex-1"
                        style={{
                          color: isDark ? "#fca5a5" : "#dc2626",
                        }}
                      >
                        {t("members.removeMember")}
                      </Text>
                    </HStack>
                  </TouchableOpacity>
                </>
              )}
            </VStack>
          </Box>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}
