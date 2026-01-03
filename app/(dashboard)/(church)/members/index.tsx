import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserProfile } from "@/hooks/useUserProfile";
import { User } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { FlatList, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { DeleteConfirmationDialog } from "./_components/DeleteConfirmationDialog";
import { InvitationCard } from "./_components/InvitationCard";
import { MemberActionPopover } from "./_components/MemberActionPopover";
import { MemberCard } from "./_components/MemberCard";
import { MemberDetailModal } from "./_components/MemberDetailModal";
import { RoleSelectionModal } from "./_components/RoleSelectionModal";
import { useMembers } from "./_hooks/useMembers";

type TabType = "members" | "invitations";
type InvitationStatusFilter = "pending" | "accepted" | "cancelled" | "declined";

export default function MembersScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("members");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [invitationStatusFilter, setInvitationStatusFilter] =
    useState<InvitationStatusFilter>("pending");
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.pageBg === "#0f172a";
  const insets = useSafeAreaInsets();
  const { can } = usePermissions();
  const { user, session } = useAuth();
  const userId = user?.id || session?.user?.id;
  const { data: profile } = useUserProfile(userId);
  const {
    members,
    invitations,
    roles,
    userRoles,
    isLoadingMembers,
    isLoadingInvitations,
    isLoadingRoles,
    acceptInvitation,
    declineInvitation,
    removeMember,
    assignRole,
    isAccepting,
    isDeclining,
    isRemoving,
    isUpdatingRole,
  } = useMembers();

  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [viewingMember, setViewingMember] = useState<User | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<User | null>(null);
  const [anchorPosition, setAnchorPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [showActionPopover, setShowActionPopover] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showMemberDetail, setShowMemberDetail] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const canViewInvitations = can("membership_requests:read");
  const canManageMembers = can("members:roles:assign") || can("members:update");

  useEffect(() => {
    if (!canViewInvitations && activeTab === "invitations") {
      setActiveTab("members");
    }
  }, [canViewInvitations, activeTab]);

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending",
  );

  const filteredMembers = useMemo(() => {
    let filtered = members;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.full_name?.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query),
      );
    }

    if (roleFilter) {
      filtered = filtered.filter((member) => member.role === roleFilter);
    }

    return filtered;
  }, [members, searchQuery, roleFilter]);

  const invitationStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    invitations.forEach((inv) => {
      counts[inv.status] = (counts[inv.status] || 0) + 1;
    });
    return counts;
  }, [invitations]);

  const invitationStatusLabels: Record<string, string> = useMemo(
    () => ({
      pending: t("members.status.pending"),
      accepted: t("members.status.accepted"),
      cancelled: t("members.status.cancelled"),
      declined: t("members.status.declined"),
    }),
    [t]
  );

  const filteredInvitations = useMemo(() => {
    let filtered = invitations;

    if (invitationStatusFilter) {
      filtered = filtered.filter(
        (inv) => inv.status === invitationStatusFilter,
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (inv) =>
          inv.user?.full_name?.toLowerCase().includes(query) ||
          inv.user?.email?.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [invitations, searchQuery, invitationStatusFilter]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach((member) => {
      counts[member.role] = (counts[member.role] || 0) + 1;
    });
    return counts;
  }, [members]);

  const roleLabels: Record<string, string> = useMemo(
    () => ({
      church_admin: t("members.roles.admin"),
      co_pastor: t("members.roles.pastor"),
      team_leader: t("members.roles.leader"),
      team_member: t("members.roles.teamMember"),
      member: t("members.roles.member"),
      visitor: t("members.roles.visitor"),
    }),
    [t]
  );

  const availableRoles = Object.keys(roleCounts).filter(
    (role) => roleCounts[role] > 0,
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
      <VStack className="flex-1">
        <Box className="px-6 pb-4 pt-6">
          <HStack className="items-center justify-between">
            <VStack className="gap-2 flex-1">
              <Text
                className="text-3xl font-bold"
                style={{ color: theme.textPrimary }}
              >
                {t("members.title")}
              </Text>
              <Text className="text-base" style={{ color: theme.textSecondary }}>
                {canViewInvitations
                  ? t("members.subtitle")
                  : t("members.viewMembers")}
              </Text>
            </VStack>
            {canManageMembers && activeTab === "members" && (
              <TouchableOpacity
                onPress={() => {
                  setIsSelectionMode(!isSelectionMode);
                  if (isSelectionMode) {
                    setSelectedMemberIds(new Set());
                  }
                }}
                activeOpacity={0.7}
                style={{
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: isSelectionMode ? theme.buttonPrimary : theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                }}
              >
                <Ionicons
                  name={isSelectionMode ? "close" : "checkmark-circle-outline"}
                  size={24}
                  color={isSelectionMode ? "#ffffff" : theme.textPrimary}
                />
              </TouchableOpacity>
            )}
          </HStack>
        </Box>

        <Box className="mb-4 px-6">
          <Box
            className="rounded-xl"
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
            <HStack className="gap-1 p-1">
              <TouchableOpacity
                onPress={() => setActiveTab("members")}
                activeOpacity={0.7}
                className={
                  canViewInvitations
                    ? "flex-1 cursor-pointer"
                    : "flex-1 cursor-pointer"
                }
                style={{
                  borderRadius: 10,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor:
                    activeTab === "members" ? theme.tabActive : "transparent",
                }}
              >
                <HStack className="items-center justify-center gap-2">
                  <Ionicons
                    name={activeTab === "members" ? "people" : "people-outline"}
                    size={18}
                    color={
                      activeTab === "members"
                        ? "#ffffff"
                        : theme.tabInactiveText
                    }
                  />
                  <Text
                    className="text-sm font-semibold"
                    style={{
                      color:
                        activeTab === "members"
                          ? "#ffffff"
                          : theme.tabInactiveText,
                    }}
                  >
                    {t("members.membersTab")} ({members.length})
                  </Text>
                </HStack>
              </TouchableOpacity>

              {canViewInvitations && (
                <TouchableOpacity
                  onPress={() => setActiveTab("invitations")}
                  activeOpacity={0.7}
                  className="flex-1 cursor-pointer"
                  style={{
                    borderRadius: 10,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor:
                      activeTab === "invitations"
                        ? theme.tabActive
                        : "transparent",
                  }}
                >
                  <HStack className="items-center justify-center gap-2">
                    <Ionicons
                      name={
                        activeTab === "invitations" ? "mail" : "mail-outline"
                      }
                      size={18}
                      color={
                        activeTab === "invitations"
                          ? "#ffffff"
                          : theme.tabInactiveText
                      }
                    />
                    <Text
                      className="text-sm font-semibold"
                      style={{
                        color:
                          activeTab === "invitations"
                            ? "#ffffff"
                            : theme.tabInactiveText,
                      }}
                    >
                      {t("members.requestsTab")} ({pendingInvitations.length})
                    </Text>
                  </HStack>
                </TouchableOpacity>
              )}
            </HStack>
          </Box>
        </Box>

        {activeTab === "members" && members.length > 0 && (
          <Box className="mb-4 px-6">
            <HStack className="gap-2" style={{ flexWrap: "wrap" }}>
              <TouchableOpacity
                onPress={() => setRoleFilter(null)}
                activeOpacity={0.7}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor:
                    roleFilter === null ? theme.tabActive : theme.tabInactiveBg,
                  borderWidth: 1,
                  borderColor:
                    roleFilter === null ? theme.tabActive : theme.cardBorder,
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{
                    color:
                      roleFilter === null ? "#ffffff" : theme.tabInactiveText,
                  }}
                >
                  {t("members.all")} ({members.length})
                </Text>
              </TouchableOpacity>
              {availableRoles.map((role) => (
                <TouchableOpacity
                  key={role}
                  onPress={() =>
                    setRoleFilter(roleFilter === role ? null : role)
                  }
                  activeOpacity={0.7}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor:
                      roleFilter === role
                        ? theme.tabActive
                        : theme.tabInactiveBg,
                    borderWidth: 1,
                    borderColor:
                      roleFilter === role ? theme.tabActive : theme.cardBorder,
                  }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{
                      color:
                        roleFilter === role ? "#ffffff" : theme.tabInactiveText,
                    }}
                  >
                    {roleLabels[role] || role} ({roleCounts[role]})
                  </Text>
                </TouchableOpacity>
              ))}
            </HStack>
          </Box>
        )}

        {canViewInvitations &&
          activeTab === "invitations" &&
          invitations.length > 0 && (
            <Box className="mb-4 px-6">
              <HStack className="gap-2" style={{ flexWrap: "wrap" }}>
                {(
                  [
                    "pending",
                    "accepted",
                    "cancelled",
                  ] as InvitationStatusFilter[]
                ).map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() =>
                      setInvitationStatusFilter(
                        invitationStatusFilter === status ? "pending" : status,
                      )
                    }
                    activeOpacity={0.7}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor:
                        invitationStatusFilter === status
                          ? theme.tabActive
                          : theme.tabInactiveBg,
                      borderWidth: 1,
                      borderColor:
                        invitationStatusFilter === status
                          ? theme.tabActive
                          : theme.cardBorder,
                    }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{
                        color:
                          invitationStatusFilter === status
                            ? "#ffffff"
                            : theme.tabInactiveText,
                      }}
                    >
                      {invitationStatusLabels[status]} (
                      {invitationStatusCounts[status] || 0})
                    </Text>
                  </TouchableOpacity>
                ))}
              </HStack>
            </Box>
          )}

        <Box className="mb-4 px-6">
          <Box
            className="rounded-xl"
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
            <HStack className="items-center gap-3 px-4 py-3">
              <Ionicons name="search" size={20} color={theme.textTertiary} />
              <TextInput
                placeholder={
                  activeTab === "members"
                    ? t("members.searchMembers")
                    : t("members.searchRequests")
                }
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
        </Box>


        <Box className="flex-1 px-6">
          {activeTab === "members" ? (
            <FlatList
              data={filteredMembers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const memberRoleIds = userRoles[item.id] || [];
                const memberRoleNames = memberRoleIds
                  .map((roleId) => {
                    const role = roles.find((r) => r.id === roleId);
                    return role?.name;
                  })
                  .filter((name): name is string => !!name);

                const isSelected = selectedMemberIds.has(item.id);
                const canSelect = userId !== item.id;

                return (
                  <MemberCard
                    member={item}
                    roleNames={memberRoleNames}
                    highlighted={
                      selectedMember?.id === item.id && showActionPopover
                    }
                    isSelectionMode={isSelectionMode}
                    isSelected={isSelected && canSelect}
                    onToggleSelect={
                      canSelect
                        ? () => {
                            const newSelected = new Set(selectedMemberIds);
                            if (isSelected) {
                              newSelected.delete(item.id);
                            } else {
                              newSelected.add(item.id);
                            }
                            setSelectedMemberIds(newSelected);
                          }
                        : undefined
                    }
                    onPress={() => {
                      if (!isSelectionMode) {
                        setViewingMember(item);
                        setShowMemberDetail(true);
                      }
                    }}
                    onLongPress={
                      !isSelectionMode && canManageMembers && userId !== item.id
                        ? (event) => {
                            const { pageX, pageY } = event.nativeEvent;
                            setAnchorPosition({ x: pageX, y: pageY });
                            setSelectedMember(item);
                            setShowActionPopover(true);
                          }
                        : undefined
                    }
                  />
                );
              }}
              ListEmptyComponent={
                <Box className="items-center justify-center py-20">
                  <Box
                    style={{
                      borderRadius: 999,
                      backgroundColor: theme.emptyBg,
                      padding: 20,
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons
                      name={
                        searchQuery || roleFilter
                          ? "search-outline"
                          : "people-outline"
                      }
                      size={48}
                      color={theme.textTertiary}
                    />
                  </Box>
                  <Text
                    className="mb-2 text-xl font-bold"
                    style={{ color: theme.textPrimary }}
                  >
                    {searchQuery || roleFilter
                      ? t("members.noMembersFound")
                      : t("members.noMembersYet")}
                  </Text>
                  <Text
                    className="max-w-xs text-center text-sm"
                    style={{ color: theme.textSecondary }}
                  >
                    {searchQuery || roleFilter
                      ? t("members.noMembersMessage")
                      : t("members.noMembersEmptyMessage")}
                  </Text>
                </Box>
              }
              refreshing={isLoadingMembers}
              contentContainerStyle={{ 
                paddingBottom: isSelectionMode && selectedMemberIds.size > 0 ? 100 : 100 
              }}
              showsVerticalScrollIndicator={false}
            />
          ) : activeTab === "invitations" ? (
            <FlatList
              data={filteredInvitations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <InvitationCard
                  invitation={item}
                  onAccept={acceptInvitation}
                  onDecline={declineInvitation}
                  isAccepting={isAccepting}
                  isDeclining={isDeclining}
                />
              )}
              ListEmptyComponent={
                <Box className="items-center justify-center py-20">
                  <Box
                    style={{
                      borderRadius: 999,
                      backgroundColor: theme.emptyBg,
                      padding: 20,
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons
                      name={
                        searchQuery || invitationStatusFilter !== "pending"
                          ? "search-outline"
                          : "mail-outline"
                      }
                      size={48}
                      color={theme.textTertiary}
                    />
                  </Box>
                  <Text
                    className="mb-2 text-xl font-bold"
                    style={{ color: theme.textPrimary }}
                  >
                    {searchQuery || invitationStatusFilter !== "pending"
                      ? t("members.noRequestsFound")
                      : t("members.noPendingRequests")}
                  </Text>
                  <Text
                    className="max-w-xs text-center text-sm"
                    style={{ color: theme.textSecondary }}
                  >
                    {searchQuery || invitationStatusFilter !== "pending"
                      ? t("members.noRequestsMessage")
                      : t("members.noRequestsEmptyMessage")}
                  </Text>
                </Box>
              }
              refreshing={isLoadingInvitations}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
            />
          ) : null}
        </Box>
      </VStack>

      {canManageMembers && (
        <>
          <MemberActionPopover
            visible={showActionPopover}
            member={selectedMember}
            anchorPosition={anchorPosition}
            currentUserId={userId}
            onClose={() => {
              setShowActionPopover(false);
              setSelectedMember(null);
              setAnchorPosition(null);
            }}
            onRemoveMember={(memberId) => {
              const member = members.find((m) => m.id === memberId);
              if (member) {
                setShowActionPopover(false);
                setSelectedMember(null);
                setAnchorPosition(null);
                setMemberToDelete(member);
                setShowDeleteDialog(true);
              }
            }}
            onChangeRole={(memberId) => {
              const member = members.find((m) => m.id === memberId);
              if (member) {
                setSelectedMember(member);
                setShowRoleModal(true);
              }
            }}
            isRemoving={isRemoving}
          />

          <RoleSelectionModal
            visible={showRoleModal}
            member={selectedMember}
            roles={roles}
            currentRoleIds={
              selectedMember ? userRoles[selectedMember.id] || [] : []
            }
            onClose={() => {
              setShowRoleModal(false);
              setSelectedMember(null);
            }}
            onSelectRole={(roleId) => {
              if (selectedMember) {
                assignRole({ userId: selectedMember.id, roleId });
                setShowRoleModal(false);
                setSelectedMember(null);
              }
            }}
            isUpdating={isUpdatingRole}
          />
        </>
      )}

      <MemberDetailModal
        visible={showMemberDetail}
        member={viewingMember}
        roleNames={
          viewingMember
            ? (userRoles[viewingMember.id] || [])
                .map((roleId) => {
                  const role = roles.find((r) => r.id === roleId);
                  return role?.name;
                })
                .filter((name): name is string => !!name)
            : []
        }
        currentUserId={userId}
        canManageMembers={canManageMembers}
        onRemoveMember={
          canManageMembers
            ? (memberId) => {
                const member = members.find((m) => m.id === memberId);
                if (member) {
                  setShowMemberDetail(false);
                  setViewingMember(null);
                  setMemberToDelete(member);
                  setShowDeleteDialog(true);
                }
              }
            : undefined
        }
        onChangeRole={
          canManageMembers
            ? (memberId) => {
                const member = members.find((m) => m.id === memberId);
                if (member) {
                  setSelectedMember(member);
                  setShowRoleModal(true);
                }
              }
            : undefined
        }
        isRemoving={isRemoving}
        onClose={() => {
          setShowMemberDetail(false);
          setViewingMember(null);
        }}
      />

      <DeleteConfirmationDialog
        visible={showDeleteDialog}
        title={t("members.removeMember")}
        message={t("members.removeMemberConfirm")}
        memberName={
          memberToDelete
            ? memberToDelete.full_name ||
              memberToDelete.email?.split("@")[0] ||
              t("members.roles.member")
            : undefined
        }
        onConfirm={() => {
          if (memberToDelete) {
            removeMember(memberToDelete.id);
            setShowDeleteDialog(false);
            setMemberToDelete(null);
          }
        }}
        onCancel={() => {
          setShowDeleteDialog(false);
          setMemberToDelete(null);
        }}
        isDeleting={isRemoving}
      />

      <DeleteConfirmationDialog
        visible={showBulkDeleteDialog}
        title={
          selectedMemberIds.size === 1
            ? t("members.removeMembers", { count: selectedMemberIds.size })
            : t("members.removeMembersPlural", { count: selectedMemberIds.size })
        }
        message={
          selectedMemberIds.size === 1
            ? t("members.removeMembersConfirm", { count: selectedMemberIds.size })
            : t("members.removeMembersConfirmPlural", { count: selectedMemberIds.size })
        }
        onConfirm={() => {
          const memberIdsArray = Array.from(selectedMemberIds);
          memberIdsArray.forEach((memberId) => {
            removeMember(memberId);
          });
          setShowBulkDeleteDialog(false);
          setSelectedMemberIds(new Set());
          setIsSelectionMode(false);
        }}
        onCancel={() => {
          setShowBulkDeleteDialog(false);
        }}
        isDeleting={isRemoving}
      />

      {isSelectionMode && selectedMemberIds.size > 0 && (
        <Box
          style={{
            position: "absolute",
            bottom: insets.bottom + 80,
            left: 0,
            right: 0,
            paddingHorizontal: 24,
            paddingBottom: 16,
            paddingTop: 16,
            backgroundColor: theme.pageBg,
            borderTopWidth: 1,
            borderTopColor: theme.cardBorder,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setShowBulkDeleteDialog(true);
            }}
            activeOpacity={0.7}
            style={{
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderRadius: 12,
              backgroundColor: isDark ? "#7f1d1d" : "#dc2626",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.3 : 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <HStack className="items-center gap-2">
              <Ionicons name="trash-outline" size={20} color="#ffffff" />
              <Text
                className="text-base font-semibold"
                style={{ color: "#ffffff" }}
              >
                {t("members.deleteSelected")} ({selectedMemberIds.size})
              </Text>
            </HStack>
          </TouchableOpacity>
        </Box>
      )}
    </SafeAreaView>
  );
}
