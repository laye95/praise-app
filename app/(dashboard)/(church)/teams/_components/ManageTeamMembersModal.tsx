import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  TouchableOpacity,
} from "react-native";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { TeamMemberWithUser, TeamMemberRole } from "@/types/team";
import { User } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { TeamMemberRow } from "./TeamMemberRow";
import {
  BottomSheetDrawerTextInput,
} from "@/components/ui/BottomSheetDrawer";
import { DrawerWithLayout } from "@/components/ui/DrawerWithLayout";

interface ManageTeamMembersModalProps {
  visible: boolean;
  teamId: string;
  teamName: string;
  members: TeamMemberWithUser[];
  allMembers: User[];
  currentUserId?: string;
  canManage?: boolean;
  onClose: () => void;
  onAddMember: (userId: string, role?: TeamMemberRole) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  isAdding?: boolean;
  isRemoving?: boolean;
}

export function ManageTeamMembersModal({
  visible,
  teamId,
  teamName,
  members,
  allMembers,
  currentUserId,
  canManage = false,
  onClose,
  onAddMember,
  onRemoveMember,
  isAdding = false,
  isRemoving = false,
}: ManageTeamMembersModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.pageBg === "#0f172a";
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => {
    if (!visible) {
      setSearchQuery("");
      setShowAddMember(false);
    }
  }, [visible]);

  const handleClose = () => {
    Keyboard.dismiss();
    setSearchQuery("");
    setShowAddMember(false);
    onClose();
  };

  const memberIds = new Set(members.map((m) => m.user_id));
  const availableMembers = allMembers.filter((member) => !memberIds.has(member.id));

  const filteredAvailableMembers = availableMembers.filter((member) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.full_name?.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
  });

  const filteredMembers = members.filter((member) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.user.full_name?.toLowerCase().includes(query) ||
      member.user.email.toLowerCase().includes(query)
    );
  });

  const handleAddMember = async (userId: string) => {
    await onAddMember(userId, "member");
    setShowAddMember(false);
    setSearchQuery("");
  };

  return (
    <DrawerWithLayout
      visible={visible}
      onClose={handleClose}
      title={t("teams.manageMembers")}
      subtitle={teamName}
      snapPoints={["75%"]}
      content={
        <VStack className="gap-4 px-6">
          <VStack>
        <Box
          className="rounded-xl"
          style={{
            backgroundColor: isDark ? "#1e293b" : "#ffffff",
            borderWidth: 1,
            borderColor: isDark ? "#334155" : "#e2e8f0",
          }}
        >
          <HStack className="items-center gap-3 px-4 py-3">
            <Ionicons name="search" size={20} color={theme.textTertiary} />
            <BottomSheetDrawerTextInput
              placeholder={t("teams.searchMembers")}
              placeholderTextColor={theme.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                fontSize: 15,
                color: theme.textPrimary,
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                activeOpacity={0.7}
                className="cursor-pointer"
              >
                <Ionicons name="close-circle" size={20} color={theme.textTertiary} />
              </TouchableOpacity>
            )}
          </HStack>
        </Box>
      </VStack>

      {canManage && !showAddMember && (
        <Box>
          <Button
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddMember(true);
            }}
            action="primary"
            variant="solid"
            size="lg"
            className="h-12 cursor-pointer rounded-xl"
            disabled={isAdding}
            style={{ backgroundColor: theme.buttonPrimary }}
          >
            <HStack className="items-center gap-2">
              <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
              <ButtonText className="text-base font-semibold" style={{ color: "#ffffff" }}>
                {t("teams.addMember")}
              </ButtonText>
            </HStack>
          </Button>
        </Box>
      )}

      {showAddMember && (
        <Box>
          <VStack className="gap-2">
            <Text
              className="text-sm font-semibold"
              style={{ color: theme.textPrimary }}
            >
              {t("teams.selectMemberToAdd")}
            </Text>
            <Box
              className="rounded-xl"
              style={{
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
                borderWidth: 1,
                borderColor: isDark ? "#334155" : "#e2e8f0",
                maxHeight: 300,
              }}
            >
              {filteredAvailableMembers.length === 0 ? (
                <Box className="items-center justify-center py-8">
                  <Text className="text-sm" style={{ color: theme.textSecondary }}>
                    {t("teams.noMembersAvailable")}
                  </Text>
                </Box>
              ) : (
                filteredAvailableMembers.map((item: User) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.7}
                    onPress={() => handleAddMember(item.id)}
                    disabled={isAdding}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.cardBorder,
                    }}
                  >
                    <HStack className="items-center justify-between">
                      <VStack className="flex-1 gap-0.5">
                        <Text
                          className="text-base font-semibold"
                          style={{ color: theme.textPrimary }}
                        >
                          {item.full_name || item.email.split("@")[0]}
                        </Text>
                        {item.full_name && (
                          <Text
                            className="text-sm"
                            style={{ color: theme.textSecondary }}
                          >
                            {item.email}
                          </Text>
                        )}
                      </VStack>
                      {isAdding && (
                        <ActivityIndicator size="small" color={theme.buttonPrimary} />
                      )}
                    </HStack>
                  </TouchableOpacity>
                ))
              )}
            </Box>
            <Button
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAddMember(false);
                setSearchQuery("");
              }}
              action="secondary"
              variant="outline"
              size="sm"
              className="h-10 cursor-pointer rounded-xl"
              disabled={isAdding}
            >
              <ButtonText className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                {t("common.cancel")}
              </ButtonText>
            </Button>
          </VStack>
        </Box>
      )}

      {filteredMembers.length === 0 ? (
        <Box className="items-center justify-center py-8">
          <Text className="text-sm" style={{ color: theme.textSecondary }}>
            {t("teams.noMembersInTeam")}
          </Text>
        </Box>
      ) : (
        filteredMembers.map((item) => (
          <TeamMemberRow
            key={item.id}
            member={item}
            currentUserId={currentUserId}
            canManage={canManage}
            onRemove={onRemoveMember}
            isRemoving={isRemoving}
          />
        ))
      )}
        </VStack>
      }
      cancelButton={{
        label: t("common.close"),
        onPress: handleClose,
      }}
    />
  );
}
