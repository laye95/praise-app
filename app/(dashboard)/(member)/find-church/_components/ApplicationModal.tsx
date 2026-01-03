import { useState, useRef, useEffect } from "react";
import { Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Animated, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Ionicons } from "@expo/vector-icons";
import { Church } from "@/types/church";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import * as Haptics from "expo-haptics";

interface ApplicationModalProps {
  visible: boolean;
  church: Church | null;
  onClose: () => void;
  onSubmit: (message: string) => void;
  isSubmitting: boolean;
}

export function ApplicationModal({
  visible,
  church,
  onClose,
  onSubmit,
  isSubmitting,
}: ApplicationModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.pageBg === "#0f172a";
  const [message, setMessage] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(500);
      fadeAnim.setValue(0);
      
      const timeoutId = setTimeout(() => {
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
        ]).start(() => {
          setTimeout(() => {
            textInputRef.current?.focus();
          }, 100);
        });
      }, 10);

      return () => clearTimeout(timeoutId);
    } else {
      slideAnim.setValue(500);
      fadeAnim.setValue(0);
      Keyboard.dismiss();
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleSubmit = () => {
    if (!message.trim()) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit(message.trim());
    setMessage("");
  };

  const handleClose = () => {
    Keyboard.dismiss();
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
      slideAnim.setValue(500);
      fadeAnim.setValue(0);
      setMessage("");
      setKeyboardVisible(false);
      onClose();
    });
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
      key={visible ? "open" : "closed"}
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
          onPress={handleClose}
          style={{ flex: 1 }}
        >
          <SafeAreaView
            style={{
              flex: 1,
              justifyContent: "flex-end",
            }}
            edges={["top"]}
          >
            <Animated.View
              style={{
                transform: [{ translateY: slideAnim }],
                width: "100%",
              }}
            >
              <TouchableOpacity 
                activeOpacity={1} 
                onPress={(e) => e.stopPropagation()}
                style={{ width: "100%" }}
              >
                <KeyboardAvoidingView
                  behavior={Platform.OS === "ios" && keyboardVisible ? "padding" : undefined}
                  keyboardVerticalOffset={0}
                  enabled={keyboardVisible}
                  style={{ width: "100%" }}
                >
                  <SafeAreaView edges={["bottom"]} style={{ width: "100%" }}>
                    <Box
                      className="rounded-t-3xl"
                      style={{
                        backgroundColor: theme.cardBg,
                        borderTopWidth: 1,
                        borderTopColor: theme.cardBorder,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: isDark ? 0.3 : 0.1,
                        shadowRadius: 16,
                        elevation: 16,
                      }}
                    >
                <VStack className="p-6 gap-6">
                  <HStack className="items-center justify-between">
                    <VStack className="flex-1">
                      <Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
                        {t("findChurch.applyToJoin")}
                      </Text>
                      {church && (
                        <Text className="text-base mt-1" style={{ color: theme.textSecondary }}>
                          {church.name}
                        </Text>
                      )}
                    </VStack>
                    <TouchableOpacity
                      onPress={handleClose}
                      activeOpacity={0.7}
                      className="cursor-pointer"
                    >
                      <Box
                        className="rounded-full p-2"
                        style={{
                          backgroundColor: theme.emptyBg,
                        }}
                      >
                        <Ionicons name="close" size={24} color={theme.textSecondary} />
                      </Box>
                    </TouchableOpacity>
                  </HStack>

                  <VStack className="gap-3">
                    <Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                      {t("findChurch.whyJoin")}
                    </Text>
                    <Text className="text-xs" style={{ color: theme.textSecondary }}>
                      {t("findChurch.whyJoinSubtitle")}
                    </Text>
                    <Box
                      className="rounded-xl"
                      style={{
                        backgroundColor: theme.emptyBg,
                        borderWidth: 1,
                        borderColor: theme.cardBorder,
                        minHeight: 120,
                      }}
                    >
                      <TextInput
                        ref={textInputRef}
                        value={message}
                        onChangeText={setMessage}
                        placeholder={t("findChurch.messagePlaceholder")}
                        placeholderTextColor={theme.textTertiary}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                        style={{
                          padding: 16,
                          fontSize: 15,
                          color: theme.textPrimary,
                          minHeight: 120,
                        }}
                        autoFocus
                        onFocus={() => setKeyboardVisible(true)}
                        onBlur={() => setKeyboardVisible(false)}
                      />
                    </Box>
                  </VStack>

                  <HStack className="gap-3">
                    <Button
                      onPress={handleClose}
                      variant="outline"
                      size="lg"
                      className="flex-1 h-14 cursor-pointer rounded-2xl"
                      isDisabled={isSubmitting}
                      style={{
                        borderWidth: 1.5,
                        borderColor: theme.buttonDecline,
                        backgroundColor: theme.cardBg,
                      }}
                    >
                      <ButtonText
                        className="text-base font-semibold"
                        style={{ color: theme.buttonDecline }}
                      >
                        {t("findChurch.cancel")}
                      </ButtonText>
                    </Button>
                    <Button
                      onPress={handleSubmit}
                      action="primary"
                      variant="solid"
                      size="lg"
                      className="flex-1 h-14 cursor-pointer rounded-2xl"
                      isDisabled={isSubmitting || !message.trim()}
                      style={{
                        backgroundColor: theme.buttonPrimary,
                        shadowColor: theme.buttonPrimary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.25,
                        shadowRadius: 12,
                        elevation: 4,
                        opacity: !message.trim() ? 0.5 : 1,
                      }}
                    >
                      {isSubmitting ? (
                        <ButtonText
                          className="text-base font-semibold"
                          style={{ color: "#ffffff" }}
                        >
                          {t("findChurch.submitting")}
                        </ButtonText>
                      ) : (
                        <ButtonText
                          className="text-base font-semibold"
                          style={{ color: "#ffffff" }}
                        >
                          {t("findChurch.submitApplication")}
                        </ButtonText>
                      )}
                    </Button>
                  </HStack>
                </VStack>
                    </Box>
                  </SafeAreaView>
                </KeyboardAvoidingView>
              </TouchableOpacity>
            </Animated.View>
          </SafeAreaView>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}
