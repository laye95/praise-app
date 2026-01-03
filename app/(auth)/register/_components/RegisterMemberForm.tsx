import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input";
import { FormControl } from "@/components/ui/form-control";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import Animated, { FadeIn } from "react-native-reanimated";
import { TouchableOpacity } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

interface RegisterMemberFormProps {
  onSubmit: (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  hideButton?: boolean;
  renderButtonOnly?: boolean;
}

export function RegisterMemberForm({
  onSubmit,
  isLoading,
  error,
  hideButton = false,
  renderButtonOnly = false,
}: RegisterMemberFormProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.pageBg === "#0f172a";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const validateName = (value: string) => {
    if (!value.trim()) {
      return t("auth.nameRequired");
    }
    if (value.trim().length < 2) {
      return t("auth.nameMinLength");
    }
    return "";
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      return t("auth.emailRequired");
    }
    if (!emailRegex.test(value.trim())) {
      return t("auth.emailInvalid");
    }
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) {
      return t("auth.passwordRequired");
    }
    if (value.length < 6) {
      return t("auth.passwordMinLength");
    }
    return "";
  };

  const validateConfirmPassword = (value: string, originalPassword: string) => {
    if (!value) {
      return t("auth.confirmPasswordRequired");
    }
    if (value !== originalPassword) {
      return t("auth.passwordsDoNotMatch");
    }
    return "";
  };

  const handleSubmit = async () => {
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmPasswordErr = validateConfirmPassword(confirmPassword, password);

    setNameError(nameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmPasswordErr);

    if (nameErr || emailErr || passwordErr || confirmPasswordErr) {
      return;
    }

    await onSubmit({ name, email, password, confirmPassword });
  };

  const renderButtonSection = () => (
    <Button
      onPress={handleSubmit}
      action="primary"
      variant="solid"
      size="lg"
      className="h-14 cursor-pointer rounded-2xl"
      isDisabled={isLoading}
      style={{
        backgroundColor: theme.buttonPrimary,
        shadowColor: theme.buttonPrimary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      {isLoading && <ButtonSpinner className="mr-2" />}
      <ButtonText className="text-base font-semibold" style={{ color: "#ffffff" }}>
        {isLoading ? t("auth.creatingAccount") : t("auth.createAccount")}
      </ButtonText>
    </Button>
  );

  if (renderButtonOnly) {
    return renderButtonSection();
  }

  return (
    <VStack className="gap-6">
      <Box
        className="rounded-xl p-4 border-l-4"
        style={{
          backgroundColor: theme.badgeInfo,
          borderLeftColor: theme.buttonPrimary,
        }}
      >
        <HStack className="items-start gap-3">
          <Ionicons name="information-circle" size={22} color={theme.buttonPrimary} />
          <VStack className="flex-1 gap-1">
            <Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
              {t("auth.findChurchLater")}
            </Text>
            <Text className="text-xs" style={{ color: theme.textSecondary, lineHeight: 18 }}>
              {t("auth.findChurchLaterSubtitle")}
            </Text>
          </VStack>
        </HStack>
      </Box>

      <Box
        className="rounded-3xl p-6"
        style={{
          backgroundColor: theme.cardBg,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.25 : 0.06,
          shadowRadius: 16,
          elevation: 3,
        }}
      >
        <HStack className="mb-6 items-center gap-3">
          <Box className="rounded-xl p-3" style={{ backgroundColor: theme.badgeWarning }}>
            <Ionicons name="person-circle" size={24} color="#f59e0b" />
          </Box>
          <VStack className="flex-1">
            <Text className="text-lg font-bold" style={{ color: theme.textPrimary }}>
              {t("auth.accountInformation")}
            </Text>
            <Text className="text-sm" style={{ color: theme.textSecondary }}>
              {t("auth.accountInformationSubtitle")}
            </Text>
          </VStack>
        </HStack>

        <VStack className="gap-6">
          <FormControl isInvalid={!!nameError}>
            <VStack className="gap-2">
              <Text className="text-sm font-medium" style={{ color: theme.textSecondary }}>
                Full Name
              </Text>
              <Box
                className="overflow-hidden rounded-2xl"
                style={{
                  backgroundColor: isDark ? theme.cardBg : "#ffffff",
                  borderWidth: nameError ? 1.5 : nameFocused ? 1.5 : 1,
                  borderColor: nameError
                    ? theme.buttonDecline
                    : nameFocused
                      ? theme.buttonPrimary
                      : isDark
                        ? theme.cardBorder
                        : "#e5e7eb",
                  shadowColor: nameFocused ? theme.buttonPrimary : "#000",
                  shadowOffset: { width: 0, height: nameFocused ? 2 : 0 },
                  shadowOpacity: nameFocused ? 0.1 : isDark ? 0.15 : 0.03,
                  shadowRadius: nameFocused ? 8 : 4,
                  elevation: nameFocused ? 2 : 1,
                }}
              >
                <Input variant="outline" size="lg" className="h-14 border-0 bg-transparent">
                  <InputSlot className="pl-5">
                    <InputIcon>
                      <Ionicons
                        name="person-outline"
                        size={22}
                        color={
                          nameError
                            ? theme.buttonDecline
                            : nameFocused
                              ? theme.buttonPrimary
                              : theme.textTertiary
                        }
                      />
                    </InputIcon>
                  </InputSlot>
                  <InputField
                    placeholder={t("auth.fullNamePlaceholder")}
                    value={name}
                    onChangeText={(text: string) => {
                      setName(text);
                      if (nameError) setNameError("");
                    }}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    autoCapitalize="words"
                    editable={!isLoading}
                    placeholderTextColor={theme.textTertiary}
                    className="pl-3 pr-5 text-base"
                    style={{ color: theme.textPrimary }}
                  />
                </Input>
              </Box>
              {nameError && (
                <Animated.View entering={FadeIn}>
                  <HStack className="mt-1 items-center gap-1.5">
                    <Ionicons name="close-circle" size={14} color={theme.buttonDecline} />
                    <Text className="text-xs" style={{ color: theme.buttonDecline }}>
                      {nameError}
                    </Text>
                  </HStack>
                </Animated.View>
              )}
            </VStack>
          </FormControl>

          <FormControl isInvalid={!!emailError || !!error}>
            <VStack className="gap-2">
              <Text className="text-sm font-medium" style={{ color: theme.textSecondary }}>
                Email
              </Text>
              <Box
                className="overflow-hidden rounded-2xl"
                style={{
                  backgroundColor: isDark ? theme.cardBg : "#ffffff",
                  borderWidth: emailError || error ? 1.5 : emailFocused ? 1.5 : 1,
                  borderColor:
                    emailError || error
                      ? theme.buttonDecline
                      : emailFocused
                        ? theme.buttonPrimary
                        : isDark
                          ? theme.cardBorder
                          : "#e5e7eb",
                  shadowColor: emailFocused ? theme.buttonPrimary : "#000",
                  shadowOffset: { width: 0, height: emailFocused ? 2 : 0 },
                  shadowOpacity: emailFocused ? 0.1 : isDark ? 0.15 : 0.03,
                  shadowRadius: emailFocused ? 8 : 4,
                  elevation: emailFocused ? 2 : 1,
                }}
              >
                <Input variant="outline" size="lg" className="h-14 border-0 bg-transparent">
                  <InputSlot className="pl-5">
                    <InputIcon>
                      <Ionicons
                        name="mail-outline"
                        size={22}
                        color={
                          emailError || error
                            ? theme.buttonDecline
                            : emailFocused
                              ? theme.buttonPrimary
                              : theme.textTertiary
                        }
                      />
                    </InputIcon>
                  </InputSlot>
                  <InputField
                    placeholder={t("auth.emailPlaceholder")}
                    value={email}
                    onChangeText={(text: string) => {
                      setEmail(text);
                      if (emailError) setEmailError("");
                    }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!isLoading}
                    placeholderTextColor={theme.textTertiary}
                    className="pl-3 pr-5 text-base"
                    style={{ color: theme.textPrimary }}
                  />
                </Input>
              </Box>
              {emailError && (
                <Animated.View entering={FadeIn}>
                  <HStack className="mt-1 items-center gap-1.5">
                    <Ionicons name="close-circle" size={14} color={theme.buttonDecline} />
                    <Text className="text-xs" style={{ color: theme.buttonDecline }}>
                      {emailError}
                    </Text>
                  </HStack>
                </Animated.View>
              )}
            </VStack>
          </FormControl>

          <FormControl isInvalid={!!passwordError}>
            <VStack className="gap-2">
              <Text className="text-sm font-medium" style={{ color: theme.textSecondary }}>
                {t("auth.password")}
              </Text>
              <Box
                className="overflow-hidden rounded-2xl"
                style={{
                  backgroundColor: isDark ? theme.cardBg : "#ffffff",
                  borderWidth: passwordError ? 1.5 : passwordFocused ? 1.5 : 1,
                  borderColor: passwordError
                    ? theme.buttonDecline
                    : passwordFocused
                      ? theme.buttonPrimary
                      : isDark
                        ? theme.cardBorder
                        : "#e5e7eb",
                  shadowColor: passwordFocused ? theme.buttonPrimary : "#000",
                  shadowOffset: { width: 0, height: passwordFocused ? 2 : 0 },
                  shadowOpacity: passwordFocused ? 0.1 : isDark ? 0.15 : 0.03,
                  shadowRadius: passwordFocused ? 8 : 4,
                  elevation: passwordFocused ? 2 : 1,
                }}
              >
                <Input variant="outline" size="lg" className="h-14 border-0 bg-transparent">
                  <InputSlot className="pl-5">
                    <InputIcon>
                      <Ionicons
                        name="lock-closed-outline"
                        size={22}
                        color={
                          passwordError
                            ? theme.buttonDecline
                            : passwordFocused
                              ? theme.buttonPrimary
                              : theme.textTertiary
                        }
                      />
                    </InputIcon>
                  </InputSlot>
                  <InputField
                    placeholder={t("auth.createPasswordPlaceholder")}
                    value={password}
                    onChangeText={(text: string) => {
                      setPassword(text);
                      if (passwordError) setPasswordError("");
                    }}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password-new"
                    editable={!isLoading}
                    placeholderTextColor={theme.textTertiary}
                    className="pl-3 pr-3 text-base"
                    style={{ color: theme.textPrimary }}
                  />
                  <InputSlot
                    onPress={() => setShowPassword(!showPassword)}
                    className="cursor-pointer pr-5"
                  >
                    <InputIcon>
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color={theme.textTertiary}
                      />
                    </InputIcon>
                  </InputSlot>
                </Input>
              </Box>
              {passwordError && (
                <Animated.View entering={FadeIn}>
                  <HStack className="mt-1 items-center gap-1.5">
                    <Ionicons name="close-circle" size={14} color={theme.buttonDecline} />
                    <Text className="text-xs" style={{ color: theme.buttonDecline }}>
                      {passwordError}
                    </Text>
                  </HStack>
                </Animated.View>
              )}
            </VStack>
          </FormControl>

          <FormControl isInvalid={!!confirmPasswordError}>
            <VStack className="gap-2">
              <Text className="text-sm font-medium" style={{ color: theme.textSecondary }}>
                {t("auth.confirmPassword")}
              </Text>
              <Box
                className="overflow-hidden rounded-2xl"
                style={{
                  backgroundColor: isDark ? theme.cardBg : "#ffffff",
                  borderWidth: confirmPasswordError ? 1.5 : confirmPasswordFocused ? 1.5 : 1,
                  borderColor: confirmPasswordError
                    ? theme.buttonDecline
                    : confirmPasswordFocused
                      ? theme.buttonPrimary
                      : isDark
                        ? theme.cardBorder
                        : "#e5e7eb",
                  shadowColor: confirmPasswordFocused ? theme.buttonPrimary : "#000",
                  shadowOffset: { width: 0, height: confirmPasswordFocused ? 2 : 0 },
                  shadowOpacity: confirmPasswordFocused ? 0.1 : isDark ? 0.15 : 0.03,
                  shadowRadius: confirmPasswordFocused ? 8 : 4,
                  elevation: confirmPasswordFocused ? 2 : 1,
                }}
              >
                <Input variant="outline" size="lg" className="h-14 border-0 bg-transparent">
                  <InputSlot className="pl-5">
                    <InputIcon>
                      <Ionicons
                        name="lock-closed-outline"
                        size={22}
                        color={
                          confirmPasswordError
                            ? theme.buttonDecline
                            : confirmPasswordFocused
                              ? theme.buttonPrimary
                              : theme.textTertiary
                        }
                      />
                    </InputIcon>
                  </InputSlot>
                  <InputField
                    placeholder={t("auth.confirmPasswordPlaceholder")}
                    value={confirmPassword}
                    onChangeText={(text: string) => {
                      setConfirmPassword(text);
                      if (confirmPasswordError) setConfirmPasswordError("");
                    }}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoComplete="password-new"
                    editable={!isLoading}
                    placeholderTextColor={theme.textTertiary}
                    className="pl-3 pr-3 text-base"
                    style={{ color: theme.textPrimary }}
                  />
                  <InputSlot
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="cursor-pointer pr-5"
                  >
                    <InputIcon>
                      <Ionicons
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color={theme.textTertiary}
                      />
                    </InputIcon>
                  </InputSlot>
                </Input>
              </Box>
              {confirmPasswordError && (
                <Animated.View entering={FadeIn}>
                  <HStack className="mt-1 items-center gap-1.5">
                    <Ionicons name="close-circle" size={14} color={theme.buttonDecline} />
                    <Text className="text-xs" style={{ color: theme.buttonDecline }}>
                      {confirmPasswordError}
                    </Text>
                  </HStack>
                </Animated.View>
              )}
            </VStack>
          </FormControl>
        </VStack>
      </Box>

      {error && (
        <Animated.View entering={FadeIn}>
          <Box
            className="rounded-xl border p-4"
            style={{
              backgroundColor: theme.badgeError,
              borderColor: theme.buttonDecline,
              opacity: 0.9,
            }}
          >
            <HStack className="items-center gap-3">
              <Ionicons name="alert-circle" size={18} color={theme.buttonDecline} />
              <Text className="flex-1 text-sm" style={{ color: theme.textPrimary }}>
                {error}
              </Text>
            </HStack>
          </Box>
        </Animated.View>
      )}

      {!hideButton && renderButtonSection()}
    </VStack>
  );
}
