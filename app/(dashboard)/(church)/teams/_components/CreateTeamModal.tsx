import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { TeamType, CreateTeamData } from "@/types/team";
import { User } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface CreateTeamModalProps {
  visible: boolean;
  members: User[];
  onClose: () => void;
  onCreate: (data: CreateTeamData) => Promise<void>;
  isCreating: boolean;
}

const TEAM_TYPES: TeamType[] = [
  "worship",
  "prayer",
  "hospitality",
  "media",
  "kids",
  "youth",
  "outreach",
  "other",
];

const getTeamTypeIcon = (type: TeamType): keyof typeof Ionicons.glyphMap => {
  const iconMap: Record<TeamType, keyof typeof Ionicons.glyphMap> = {
    worship: "musical-notes",
    prayer: "heart",
    hospitality: "people",
    media: "videocam",
    kids: "happy",
    youth: "school",
    outreach: "hand-left",
    other: "grid",
  };
  return iconMap[type];
};

const getTeamTypeColor = (type: TeamType, isDark: boolean): string => {
  const colorMap: Record<TeamType, string> = {
    worship: isDark ? "#a5b4fc" : "#6366f1",
    prayer: isDark ? "#f87171" : "#ef4444",
    hospitality: isDark ? "#34d399" : "#10b981",
    media: isDark ? "#60a5fa" : "#3b82f6",
    kids: isDark ? "#fbbf24" : "#f59e0b",
    youth: isDark ? "#a78bfa" : "#8b5cf6",
    outreach: isDark ? "#fb7185" : "#f43f5e",
    other: isDark ? "#94a3b8" : "#64748b",
  };
  return colorMap[type];
};

const getTeamTypeBg = (type: TeamType, isDark: boolean): string => {
  const bgMap: Record<TeamType, string> = {
    worship: isDark ? "#312e81" : "#eef2ff",
    prayer: isDark ? "#7f1d1d" : "#fef2f2",
    hospitality: isDark ? "#064e3b" : "#f0fdf4",
    media: isDark ? "#1e3a8a" : "#eff6ff",
    kids: isDark ? "#78350f" : "#fef3c7",
    youth: isDark ? "#581c87" : "#f3e8ff",
    outreach: isDark ? "#831843" : "#fdf2f8",
    other: isDark ? "#1e293b" : "#f1f5f9",
  };
  return bgMap[type];
};


export function CreateTeamModal({
  visible,
  members,
  onClose,
  onCreate,
  isCreating,
}: CreateTeamModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.pageBg === "#0f172a";
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState<TeamType>("worship");
  const [selectedLeaderIds, setSelectedLeaderIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const nameInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);

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
      setName("");
      setDescription("");
      setSelectedType("worship");
      setSelectedLeaderIds(new Set());
      setSelectedMemberIds(new Set());
      setSearchQuery("");
      onClose();
    });
  };

  const handleToggleLeader = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLeaderIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
        setSelectedMemberIds((prevMembers) => {
          const nextMembers = new Set(prevMembers);
          nextMembers.delete(userId);
          return nextMembers;
        });
      }
      return next;
    });
  };

  const handleToggleMember = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
        setSelectedLeaderIds((prevLeaders) => {
          const nextLeaders = new Set(prevLeaders);
          nextLeaders.delete(userId);
          return nextLeaders;
        });
      }
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim() || (selectedLeaderIds.size === 0 && selectedMemberIds.size === 0) || isCreating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();
    await onCreate({
      name: name.trim(),
      description: description.trim() || undefined,
      type: selectedType,
      leader_ids: Array.from(selectedLeaderIds),
      member_ids: Array.from(selectedMemberIds),
    });
  };

  const canCreate =
    name.trim().length >= 2 &&
    (selectedLeaderIds.size > 0 || selectedMemberIds.size > 0) &&
    !isCreating;

  const filteredMembers = members.filter((member) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.full_name?.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
  });

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
            maxHeight: "95%",
          }}
        >
          <SafeAreaView edges={["bottom"]}>
            <Box
              className="rounded-t-3xl"
              style={{
                backgroundColor: theme.cardBg,
                borderTopWidth: 1,
                borderTopColor: theme.cardBorder,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <VStack className="gap-0">
                <Box className="items-center pt-4 pb-2">
                  <Box
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: theme.textTertiary,
                      opacity: 0.5,
                    }}
                  />
                </Box>

                <Box className="px-6 pt-4 pb-6">
                  <HStack className="items-center justify-between mb-1">
                    <Text
                      className="text-2xl font-bold"
                      style={{ color: theme.textPrimary }}
                    >
                      {t("teams.createTeam")}
                    </Text>
                    <TouchableOpacity
                      onPress={handleClose}
                      activeOpacity={0.7}
                      disabled={isCreating}
                      className="cursor-pointer"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name="close"
                        size={20}
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>
                  </HStack>
                  <Text
                    className="text-sm mt-1"
                    style={{ color: theme.textSecondary }}
                  >
                    {t("teams.createTeamDescription")}
                  </Text>
                </Box>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  className="px-6"
                  style={{ maxHeight: 500 }}
                  keyboardShouldPersistTaps="handled"
                >
                  <VStack className="gap-6 pb-2">
                    <VStack className="gap-3">
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: theme.textPrimary }}
                      >
                        {t("teams.teamName")}
                      </Text>
                      <Box
                        className="rounded-xl"
                        style={{
                          backgroundColor: isDark ? "#1e293b" : "#ffffff",
                          borderWidth: 1,
                          borderColor: isDark ? "#334155" : "#e2e8f0",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: isDark ? 0.2 : 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }}
                      >
                        <TextInput
                          ref={nameInputRef}
                          placeholder={t("teams.teamNamePlaceholder")}
                          placeholderTextColor={theme.textTertiary}
                          value={name}
                          onChangeText={setName}
                          autoCapitalize="words"
                          returnKeyType="next"
                          editable={!isCreating}
                          onSubmitEditing={() =>
                            descriptionInputRef.current?.focus()
                          }
                          style={{
                            color: theme.textPrimary,
                            fontSize: 16,
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                          }}
                        />
                      </Box>
                    </VStack>

                    <VStack className="gap-3">
                      <VStack className="gap-1">
                        <Text
                          className="text-sm font-semibold"
                          style={{ color: theme.textPrimary }}
                        >
                          {t("teams.teamType")}
                        </Text>
                        <Text
                          className="text-xs"
                          style={{ color: theme.textSecondary }}
                        >
                          {t("teams.teamTypeDescription")}
                        </Text>
                      </VStack>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8, paddingRight: 4 }}
                      >
                        {TEAM_TYPES.map((type) => {
                          const isSelected = selectedType === type;
                          const iconName = getTeamTypeIcon(type);
                          const iconColor = getTeamTypeColor(type, isDark);
                          const iconBg = getTeamTypeBg(type, isDark);
                          return (
                            <TouchableOpacity
                              key={type}
                              activeOpacity={0.7}
                              onPress={() => {
                                Haptics.impactAsync(
                                  Haptics.ImpactFeedbackStyle.Light,
                                );
                                setSelectedType(type);
                              }}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 10,
                                backgroundColor: isSelected
                                  ? theme.buttonPrimary
                                  : isDark
                                    ? "#1e293b"
                                    : "#ffffff",
                                borderWidth: isSelected ? 0 : 1,
                                borderColor: isDark ? "#334155" : "#e2e8f0",
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <Box
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 6,
                                  backgroundColor: isSelected
                                    ? "rgba(255, 255, 255, 0.2)"
                                    : iconBg,
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Ionicons
                                  name={iconName}
                                  size={14}
                                  color={
                                    isSelected ? "#ffffff" : iconColor
                                  }
                                />
                              </Box>
                              <Text
                                className="text-sm font-medium"
                                style={{
                                  color: isSelected
                                    ? "#ffffff"
                                    : theme.textPrimary,
                                }}
                              >
                                {t(`teams.types.${type}`)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </VStack>

                    <VStack className="gap-3">
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: theme.textPrimary }}
                      >
                        {t("teams.description")}
                        <Text
                          className="text-xs font-normal"
                          style={{ color: theme.textSecondary }}
                        >
                          {" "}
                          ({t("common.optional")})
                        </Text>
                      </Text>
                      <Box
                        className="rounded-xl"
                        style={{
                          backgroundColor: isDark ? "#1e293b" : "#ffffff",
                          borderWidth: 1,
                          borderColor: isDark ? "#334155" : "#e2e8f0",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: isDark ? 0.2 : 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }}
                      >
                        <TextInput
                          ref={descriptionInputRef}
                          placeholder={t("teams.descriptionPlaceholder")}
                          placeholderTextColor={theme.textTertiary}
                          value={description}
                          onChangeText={setDescription}
                          multiline
                          numberOfLines={3}
                          editable={!isCreating}
                          textAlignVertical="top"
                          style={{
                            color: theme.textPrimary,
                            fontSize: 16,
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            minHeight: 90,
                            lineHeight: 22,
                          }}
                        />
                      </Box>
                    </VStack>

                    <VStack className="gap-3">
                      <VStack className="gap-1">
                        <Text
                          className="text-sm font-semibold"
                          style={{ color: theme.textPrimary }}
                        >
                          {t("teams.selectTeamMembers")}
                        </Text>
                        <Text
                          className="text-xs"
                          style={{ color: theme.textSecondary }}
                        >
                          {t("teams.selectTeamMembersDescription")}
                        </Text>
                      </VStack>
                      <Box
                        className="rounded-xl"
                        style={{
                          backgroundColor: theme.cardBg,
                          borderWidth: 1,
                          borderColor: theme.cardBorder,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isDark ? 0.3 : 0.06,
                          shadowRadius: 8,
                          elevation: 3,
                        }}
                      >
                        <HStack className="items-center gap-3 px-4 py-3 border-b"
                          style={{ borderBottomWidth: 1, borderBottomColor: theme.cardBorder }}
                        >
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
                        <Box style={{ maxHeight: 240 }}>
                          {filteredMembers.length === 0 ? (
                            <Box className="items-center justify-center py-12">
                              <Box
                                style={{
                                  borderRadius: 999,
                                  backgroundColor: theme.emptyBg,
                                  padding: 16,
                                  marginBottom: 12,
                                }}
                              >
                                <Ionicons
                                  name="people-outline"
                                  size={32}
                                  color={theme.textTertiary}
                                />
                              </Box>
                              <Text
                                className="text-sm font-medium"
                                style={{ color: theme.textSecondary }}
                              >
                                {t("teams.noMembersFound")}
                              </Text>
                            </Box>
                          ) : (
                            <ScrollView
                              nestedScrollEnabled={true}
                              showsVerticalScrollIndicator={true}
                              style={{ maxHeight: 240 }}
                            >
                              {filteredMembers.map((item) => {
                                const isLeader = selectedLeaderIds.has(item.id);
                                const isMember = selectedMemberIds.has(item.id);
                                const isSelected = isLeader || isMember;
                                const initials = getInitials(
                                  item.full_name,
                                  item.email,
                                );
                                const displayName =
                                  item.full_name || item.email.split("@")[0];
                                return (
                                  <Box
                                    key={item.id}
                                    style={{
                                      paddingHorizontal: 16,
                                      paddingVertical: 14,
                                      borderBottomWidth: 1,
                                      borderBottomColor: theme.cardBorder,
                                      backgroundColor: isSelected
                                        ? (isDark ? "#1e293b" : "#f8fafc")
                                        : "transparent",
                                    }}
                                  >
                                    <HStack className="items-center gap-3">
                                      <Box
                                        className="rounded-xl"
                                        style={{
                                          width: 40,
                                          height: 40,
                                          backgroundColor: isLeader
                                            ? theme.buttonPrimary
                                            : isMember
                                              ? theme.textSecondary
                                              : theme.avatarPrimary,
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <Text
                                          className="text-sm font-semibold"
                                          style={{
                                            color: isLeader || isMember
                                              ? "#ffffff"
                                              : theme.buttonPrimary,
                                          }}
                                        >
                                          {initials}
                                        </Text>
                                      </Box>
                                      <VStack className="flex-1 gap-0.5">
                                        <Text
                                          className="text-base font-semibold"
                                          style={{ color: theme.textPrimary }}
                                        >
                                          {displayName}
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
                                      <HStack className="gap-2">
                                        <TouchableOpacity
                                          activeOpacity={0.7}
                                          onPress={() => handleToggleLeader(item.id)}
                                          style={{
                                            paddingHorizontal: 10,
                                            paddingVertical: 6,
                                            borderRadius: 6,
                                            backgroundColor: isLeader
                                              ? theme.buttonPrimary
                                              : isDark
                                                ? "#1e293b"
                                                : "#ffffff",
                                            borderWidth: 1,
                                            borderColor: isLeader
                                              ? theme.buttonPrimary
                                              : theme.cardBorder,
                                          }}
                                        >
                                          <Text
                                            className="text-xs font-semibold"
                                            style={{
                                              color: isLeader
                                                ? "#ffffff"
                                                : theme.textSecondary,
                                            }}
                                          >
                                            {t("teams.leader")}
                                          </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          activeOpacity={0.7}
                                          onPress={() => handleToggleMember(item.id)}
                                          style={{
                                            paddingHorizontal: 10,
                                            paddingVertical: 6,
                                            borderRadius: 6,
                                            backgroundColor: isMember
                                              ? theme.textSecondary
                                              : isDark
                                                ? "#1e293b"
                                                : "#ffffff",
                                            borderWidth: 1,
                                            borderColor: isMember
                                              ? theme.textSecondary
                                              : theme.cardBorder,
                                          }}
                                        >
                                          <Text
                                            className="text-xs font-semibold"
                                            style={{
                                              color: isMember
                                                ? "#ffffff"
                                                : theme.textSecondary,
                                            }}
                                          >
                                            {t("teams.member")}
                                          </Text>
                                        </TouchableOpacity>
                                      </HStack>
                                    </HStack>
                                  </Box>
                                );
                              })}
                            </ScrollView>
                          )}
                        </Box>
                      </Box>
                    </VStack>
                  </VStack>
                </ScrollView>

                <Box
                  className="px-6 pt-5 pb-6 border-t"
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: theme.cardBorder,
                    backgroundColor: theme.cardBg,
                    minHeight: 140,
                  }}
                >
                  <VStack className="gap-3">
                    <Button
                      onPress={handleCreate}
                      disabled={!canCreate}
                      action="primary"
                      variant="solid"
                      size="lg"
                      className="h-14 cursor-pointer rounded-2xl"
                      style={{
                        backgroundColor: canCreate
                          ? theme.buttonPrimary
                          : theme.textTertiary,
                        shadowColor: canCreate ? theme.buttonPrimary : "transparent",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: canCreate ? 0.3 : 0,
                        shadowRadius: 8,
                        elevation: canCreate ? 4 : 0,
                      }}
                    >
                      {isCreating ? (
                        <HStack className="items-center gap-2">
                          <ActivityIndicator size="small" color="#ffffff" />
                          <ButtonText
                            className="text-base font-semibold"
                            style={{ color: "#ffffff" }}
                          >
                            {t("teams.creating")}
                          </ButtonText>
                        </HStack>
                      ) : (
                        <ButtonText
                          className="text-base font-semibold"
                          style={{ color: "#ffffff" }}
                        >
                          {t("teams.createTeam")}
                        </ButtonText>
                      )}
                    </Button>
                    <TouchableOpacity
                      onPress={handleClose}
                      disabled={isCreating}
                      activeOpacity={0.7}
                      className="cursor-pointer"
                    >
                      <Text
                        className="text-center text-base font-semibold py-3"
                        style={{ color: theme.textSecondary }}
                      >
                        {t("common.cancel")}
                      </Text>
                    </TouchableOpacity>
                  </VStack>
                </Box>
              </VStack>
            </Box>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
