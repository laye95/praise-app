import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  Modal,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(500);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(500);
      fadeAnim.setValue(0);
      setSearchQuery("");
      setShowAddMember(false);
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSearchQuery("");
      setShowAddMember(false);
      onClose();
    });
  };

  const memberIds = new Set(members.map((m) => m.user_id));
  const availableMembers = allMembers.filter(
    (member) => !memberIds.has(member.id),
  );

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

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          opacity: fadeAnim,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{ flex: 1 }}
          onPress={handleClose}
        />
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            transform: [{ translateY: slideAnim }],
            maxHeight: "98%",
          }}
        >
          <SafeAreaView edges={["bottom"]}>
            <Box
              className="rounded-t-3xl"
              style={{
                backgroundColor: theme.cardBg,
                borderTopWidth: 1,
                borderTopColor: theme.cardBorder,
                paddingTop: 8,
                paddingBottom: 32,
              }}
            >
              <VStack className="mb-4">
                <Box className="mb-3 items-center px-6">
                  <Box
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: theme.textTertiary,
                      marginBottom: 16,
                    }}
                  />
                  <Text
                    className="mb-1 text-lg font-bold"
                    style={{ color: theme.textPrimary }}
                  >
                    {t("teams.manageMembers")}
                  </Text>
                  <Text
                    className="text-sm"
                    style={{ color: theme.textSecondary }}
                  >
                    {teamName}
                  </Text>
                </Box>
              </VStack>

              <VStack className="px-6 mb-4">
                <Box
                  className="rounded-xl"
                  style={{
                    backgroundColor: isDark ? "#1e293b" : "#ffffff",
                    borderWidth: 1,
                    borderColor: isDark ? "#334155" : "#e2e8f0",
                  }}
                >
                  <HStack className="items-center gap-3 px-4 py-3">
                    <Ionicons
                      name="search"
                      size={20}
                      color={theme.textTertiary}
                    />
                    <TextInput
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
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color={theme.textTertiary}
                        />
                      </TouchableOpacity>
                    )}
                  </HStack>
                </Box>
              </VStack>

              {canManage && !showAddMember && (
                <Box className="px-6 mb-4">
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
                    style={{
                      backgroundColor: theme.buttonPrimary,
                    }}
                  >
                    <HStack className="items-center gap-2">
                      <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
                      <ButtonText
                        className="text-base font-semibold"
                        style={{ color: "#ffffff" }}
                      >
                        {t("teams.addMember")}
                      </ButtonText>
                    </HStack>
                  </Button>
                </Box>
              )}

              {showAddMember && (
                <Box className="px-6 mb-4">
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
                          <Text
                            className="text-sm"
                            style={{ color: theme.textSecondary }}
                          >
                            {t("teams.noMembersAvailable")}
                          </Text>
                        </Box>
                      ) : (
                        <FlatList
                          data={filteredAvailableMembers}
                          keyExtractor={(item) => item.id}
                          renderItem={({ item }) => (
                            <TouchableOpacity
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
                          )}
                          nestedScrollEnabled={true}
                        />
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
                      <ButtonText
                        className="text-sm font-semibold"
                        style={{ color: theme.textPrimary }}
                      >
                        {t("common.cancel")}
                      </ButtonText>
                    </Button>
                  </VStack>
                </Box>
              )}

              <Box className="flex-1 px-6" style={{ maxHeight: 450 }}>
                <FlatList
                  data={filteredMembers}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TeamMemberRow
                      member={item}
                      currentUserId={currentUserId}
                      canManage={canManage}
                      onRemove={onRemoveMember}
                      isRemoving={isRemoving}
                    />
                  )}
                  ListEmptyComponent={
                    <Box className="items-center justify-center py-8">
                      <Text
                        className="text-sm"
                        style={{ color: theme.textSecondary }}
                      >
                        {t("teams.noMembersInTeam")}
                      </Text>
                    </Box>
                  }
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                />
              </Box>

              <Box className="px-6 mt-4">
                <Button
                  onPress={handleClose}
                  action="secondary"
                  variant="outline"
                  size="lg"
                  className="h-12 cursor-pointer rounded-xl"
                >
                  <ButtonText
                    className="text-base font-semibold"
                    style={{ color: theme.textPrimary }}
                  >
                    {t("common.close")}
                  </ButtonText>
                </Button>
              </Box>
            </Box>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
