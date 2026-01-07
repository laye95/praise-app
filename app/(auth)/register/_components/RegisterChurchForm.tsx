import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { FormControl } from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface RegisterChurchFormProps {
  onSubmit: (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    churchName: string;
    denomination?: string;
    location?: string;
    timezone?: string;
  }) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  hideButton?: boolean;
  renderButtonOnly?: boolean;
  currentStep?: number;
  onStepChange?: (step: number) => void;
  formData?: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    churchName: string;
    denomination: string;
    location: string;
  };
  onFormDataChange?: (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    churchName: string;
    denomination: string;
    location: string;
  }) => void;
}

export function RegisterChurchForm({
  onSubmit,
  isLoading,
  error,
  hideButton = false,
  renderButtonOnly = false,
  currentStep: controlledStep,
  onStepChange,
  formData: controlledFormData,
  onFormDataChange,
}: RegisterChurchFormProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [internalStep, setInternalStep] = useState(1);
  const currentStep = controlledStep ?? internalStep;
  const setCurrentStep = onStepChange ?? setInternalStep;
  
  const [internalFormData, setInternalFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    churchName: "",
    denomination: "",
    location: "",
  });
  
  const formData = controlledFormData ?? internalFormData;
  const setFormData = onFormDataChange ?? setInternalFormData;
  
  const name = formData.name;
  const email = formData.email;
  const password = formData.password;
  const confirmPassword = formData.confirmPassword;
  const churchName = formData.churchName;
  const denomination = formData.denomination;
  const location = formData.location;
  
  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [churchNameError, setChurchNameError] = useState("");
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [churchNameFocused, setChurchNameFocused] = useState(false);
  const [denominationFocused, setDenominationFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);

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

  const validateChurchName = (value: string) => {
    if (!value.trim()) {
      return t("auth.churchNameRequired");
    }
    if (value.trim().length < 2) {
      return t("auth.churchNameMinLength");
    }
    return "";
  };

  const validateStep1 = () => {
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmPasswordErr = validateConfirmPassword(
      confirmPassword,
      password,
    );

    setNameError(nameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmPasswordErr);

    return !nameErr && !emailErr && !passwordErr && !confirmPasswordErr;
  };

  const validateStep2 = () => {
    const churchNameErr = validateChurchName(churchName);
    setChurchNameError(churchNameErr);
    return !churchNameErr;
  };

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedChurchName = churchName.trim();
  
  const nameValid = trimmedName.length >= 2;
  const emailValid = trimmedEmail.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const passwordValid = password.length >= 6;
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && confirmPassword === password;
  
  const isStep1Valid = nameValid && emailValid && passwordValid && passwordsMatch;
  const isStep2Valid = trimmedChurchName.length >= 2;

  const handleNext = () => {
    if (isStep1Valid) {
      setCurrentStep(2);
    } else {
      validateStep1();
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    if (!isStep2Valid) {
      validateStep2();
      return;
    }

    await onSubmit({
      name,
      email,
      password,
      confirmPassword,
      churchName,
      denomination: denomination || undefined,
      location: location || undefined,
    });
  };

  const renderButtonSection = () => {
    const step1Disabled = isLoading || !isStep1Valid;
    const step2Disabled = isLoading || !isStep2Valid;
    
    return (
      <VStack className="gap-2">
        {currentStep === 1 ? (
          <Button
            onPress={handleNext}
            action="primary"
            variant="solid"
            size="lg"
            className="h-14 cursor-pointer rounded-2xl"
            isDisabled={step1Disabled}
          style={{
            backgroundColor: step1Disabled ? theme.textTertiary : theme.buttonPrimary,
            shadowColor: step1Disabled ? "transparent" : theme.buttonPrimary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: step1Disabled ? 0 : 0.25,
            shadowRadius: 12,
            elevation: step1Disabled ? 0 : 4,
          }}
        >
          <HStack className="items-center gap-2">
            <ButtonText className="text-base font-semibold" style={{ color: "#ffffff" }}>
              {t("auth.next")}
            </ButtonText>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          </HStack>
        </Button>
      ) : (
        <HStack className="gap-3">
          <Button
            onPress={handleBack}
            variant="outline"
            size="lg"
            className="flex-1 h-14 cursor-pointer rounded-2xl"
            isDisabled={isLoading}
            style={{
              borderColor: theme.cardBorder,
            }}
          >
            <HStack className="items-center gap-2">
              <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
              <ButtonText className="text-base font-semibold" style={{ color: theme.textPrimary }}>
                {t("auth.back")}
              </ButtonText>
            </HStack>
          </Button>
          <Button
            onPress={handleSubmit}
            action="primary"
            variant="solid"
            size="lg"
            className="flex-1 h-14 cursor-pointer rounded-2xl"
            isDisabled={step2Disabled}
            style={{
              backgroundColor: step2Disabled ? theme.textTertiary : theme.buttonPrimary,
              shadowColor: step2Disabled ? "transparent" : theme.buttonPrimary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: step2Disabled ? 0 : 0.25,
              shadowRadius: 12,
              elevation: step2Disabled ? 0 : 4,
            }}
          >
            {isLoading ? (
              <ButtonSpinner className="mr-2" />
            ) : null}
            <ButtonText className="text-base font-semibold" style={{ color: "#ffffff" }}>
              {isLoading ? t("auth.creating") : t("auth.createChurch")}
            </ButtonText>
          </Button>
        </HStack>
      )}
      {currentStep === 2 && (
        <Text className="text-center text-xs" style={{ color: theme.textTertiary }}>
          {t("auth.termsAgreement")}
        </Text>
      )}
    </VStack>
    );
  };

  if (renderButtonOnly) {
    return renderButtonSection();
  }

  return (
    <VStack className="gap-6">
      {currentStep === 1 && (
        <Box
          className="rounded-3xl p-8"
          style={{
            backgroundColor: theme.cardBg,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.25 : 0.06,
            shadowRadius: 16,
            elevation: 3,
          }}
        >
          <VStack className="mb-8 gap-3">
            <HStack className="items-center gap-3">
              <Box
                className="rounded-2xl p-3.5"
                style={{
                  backgroundColor: theme.avatarPrimary,
                  width: 56,
                  height: 56,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="person" size={26} color={isDark ? "#ffffff" : theme.buttonPrimary} />
              </Box>
              <VStack className="flex-1 gap-1">
                <HStack className="items-center gap-2">
                  <Box
                    className="rounded-full px-2.5 py-1"
                    style={{ backgroundColor: theme.buttonPrimary + "20" }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: theme.buttonPrimary }}>
                      {t("auth.step1Of2")}
                    </Text>
                  </Box>
                </HStack>
                <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
                  {t("auth.pastorInformation")}
                </Text>
                <Text className="text-sm" style={{ color: theme.textSecondary }}>
                  {t("auth.pastorInformationSubtitle")}
                </Text>
              </VStack>
            </HStack>
          </VStack>

        <VStack className="gap-6">
          <FormControl isInvalid={!!nameError}>
            <VStack className="gap-2">
              <Text className="text-sm font-medium" style={{ color: theme.textSecondary }}>
                {t("auth.fullName")}
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
                      updateField("name", text);
                      if (nameError) setNameError("");
                    }}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => {
                      setNameFocused(false);
                      const error = validateName(name);
                      setNameError(error);
                    }}
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
                {t("auth.email")}
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
                      updateField("email", text);
                      if (emailError) setEmailError("");
                    }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => {
                      setEmailFocused(false);
                      const error = validateEmail(email);
                      setEmailError(error);
                    }}
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
                      updateField("password", text);
                      if (passwordError) setPasswordError("");
                      if (confirmPassword && confirmPassword !== text) {
                        setConfirmPasswordError(t("auth.passwordsDoNotMatch"));
                      } else if (confirmPasswordError && confirmPassword === text) {
                        setConfirmPasswordError("");
                      }
                    }}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => {
                      setPasswordFocused(false);
                      const error = validatePassword(password);
                      setPasswordError(error);
                    }}
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
                      updateField("confirmPassword", text);
                      if (confirmPasswordError) setConfirmPasswordError("");
                    }}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => {
                      setConfirmPasswordFocused(false);
                      const error = validateConfirmPassword(confirmPassword, password);
                      setConfirmPasswordError(error);
                    }}
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
      )}

      {currentStep === 2 && (
        <Box
          className="rounded-3xl p-8"
          style={{
            backgroundColor: theme.cardBg,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.25 : 0.06,
            shadowRadius: 16,
            elevation: 3,
          }}
        >
          <VStack className="mb-8 gap-3">
            <HStack className="items-center gap-3">
              <Box
                className="rounded-2xl p-3.5"
                style={{
                  backgroundColor: theme.badgeSuccess,
                  width: 56,
                  height: 56,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="business" size={26} color={theme.buttonAccept} />
              </Box>
              <VStack className="flex-1 gap-1">
                <HStack className="items-center gap-2">
                  <Box
                    className="rounded-full px-2.5 py-1"
                    style={{ backgroundColor: theme.buttonAccept + "20" }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: theme.buttonAccept }}>
                      {t("auth.step2Of2")}
                    </Text>
                  </Box>
                </HStack>
                <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
                  {t("auth.churchInformation")}
                </Text>
                <Text className="text-sm" style={{ color: theme.textSecondary }}>
                  {t("auth.churchInformationSubtitle")}
                </Text>
              </VStack>
            </HStack>
          </VStack>

        <VStack className="gap-6">
          <FormControl isInvalid={!!churchNameError}>
            <VStack className="gap-2">
              <Text className="text-sm font-medium" style={{ color: theme.textSecondary }}>
                {t("auth.churchName")} <Text style={{ color: theme.buttonDecline }}>*</Text>
              </Text>
              <Box
                className="overflow-hidden rounded-2xl"
                style={{
                  backgroundColor: isDark ? theme.cardBg : "#ffffff",
                  borderWidth: churchNameError ? 1.5 : churchNameFocused ? 1.5 : 1,
                  borderColor: churchNameError
                    ? theme.buttonDecline
                    : churchNameFocused
                      ? theme.buttonPrimary
                      : isDark
                        ? theme.cardBorder
                        : "#e5e7eb",
                  shadowColor: churchNameFocused ? theme.buttonPrimary : "#000",
                  shadowOffset: { width: 0, height: churchNameFocused ? 2 : 0 },
                  shadowOpacity: churchNameFocused ? 0.1 : isDark ? 0.15 : 0.03,
                  shadowRadius: churchNameFocused ? 8 : 4,
                  elevation: churchNameFocused ? 2 : 1,
                }}
              >
                <Input variant="outline" size="lg" className="h-14 border-0 bg-transparent">
                  <InputSlot className="pl-5">
                    <InputIcon>
                      <Ionicons
                        name="business-outline"
                        size={22}
                        color={
                          churchNameError
                            ? theme.buttonDecline
                            : churchNameFocused
                              ? theme.buttonPrimary
                              : theme.textTertiary
                        }
                      />
                    </InputIcon>
                  </InputSlot>
                  <InputField
                    placeholder={t("auth.churchNamePlaceholder")}
                    value={churchName}
                    onChangeText={(text: string) => {
                      updateField("churchName", text);
                      if (churchNameError) setChurchNameError("");
                    }}
                    onFocus={() => setChurchNameFocused(true)}
                    onBlur={() => {
                      setChurchNameFocused(false);
                      const error = validateChurchName(churchName);
                      setChurchNameError(error);
                    }}
                    editable={!isLoading}
                    placeholderTextColor={theme.textTertiary}
                    className="pl-3 pr-5 text-base"
                    style={{ color: theme.textPrimary }}
                  />
                </Input>
              </Box>
              {churchNameError && (
                <Animated.View entering={FadeIn}>
                  <HStack className="mt-1 items-center gap-1.5">
                    <Ionicons name="close-circle" size={14} color={theme.buttonDecline} />
                    <Text className="text-xs" style={{ color: theme.buttonDecline }}>
                      {churchNameError}
                    </Text>
                  </HStack>
                </Animated.View>
              )}
            </VStack>
          </FormControl>

          <FormControl>
            <VStack className="gap-2">
              <HStack className="items-center gap-2">
                <Text className="text-sm font-medium" style={{ color: theme.textSecondary }}>
                  {t("auth.denomination")}
                </Text>
                <Text className="text-xs" style={{ color: theme.textTertiary }}>
                  {t("auth.optional")}
                </Text>
              </HStack>
              <Box
                className="overflow-hidden rounded-2xl"
                style={{
                  backgroundColor: isDark ? theme.cardBg : "#ffffff",
                  borderWidth: denominationFocused ? 1.5 : 1,
                  borderColor: denominationFocused
                    ? theme.buttonPrimary
                    : isDark
                      ? theme.cardBorder
                      : "#e5e7eb",
                  shadowColor: denominationFocused ? theme.buttonPrimary : "#000",
                  shadowOffset: { width: 0, height: denominationFocused ? 2 : 0 },
                  shadowOpacity: denominationFocused ? 0.1 : isDark ? 0.15 : 0.03,
                  shadowRadius: denominationFocused ? 8 : 4,
                  elevation: denominationFocused ? 2 : 1,
                }}
              >
                <Input variant="outline" size="lg" className="h-14 border-0 bg-transparent">
                  <InputSlot className="pl-5">
                    <InputIcon>
                      <Ionicons
                        name="book-outline"
                        size={22}
                        color={
                          denominationFocused ? theme.buttonPrimary : theme.textTertiary
                        }
                      />
                    </InputIcon>
                  </InputSlot>
                  <InputField
                    placeholder={t("auth.denominationPlaceholder")}
                    value={denomination}
                    onChangeText={(text: string) => updateField("denomination", text)}
                    onFocus={() => setDenominationFocused(true)}
                    onBlur={() => setDenominationFocused(false)}
                    editable={!isLoading}
                    placeholderTextColor={theme.textTertiary}
                    className="pl-3 pr-5 text-base"
                    style={{ color: theme.textPrimary }}
                  />
                </Input>
              </Box>
            </VStack>
          </FormControl>

          <FormControl>
            <VStack className="gap-2">
              <HStack className="items-center gap-2">
                <Text className="text-sm font-medium" style={{ color: theme.textSecondary }}>
                  {t("auth.location")}
                </Text>
                <Text className="text-xs" style={{ color: theme.textTertiary }}>
                  {t("auth.optional")}
                </Text>
              </HStack>
              <Box
                className="overflow-hidden rounded-2xl"
                style={{
                  backgroundColor: isDark ? theme.cardBg : "#ffffff",
                  borderWidth: locationFocused ? 1.5 : 1,
                  borderColor: locationFocused
                    ? theme.buttonPrimary
                    : isDark
                      ? theme.cardBorder
                      : "#e5e7eb",
                  shadowColor: locationFocused ? theme.buttonPrimary : "#000",
                  shadowOffset: { width: 0, height: locationFocused ? 2 : 0 },
                  shadowOpacity: locationFocused ? 0.1 : isDark ? 0.15 : 0.03,
                  shadowRadius: locationFocused ? 8 : 4,
                  elevation: locationFocused ? 2 : 1,
                }}
              >
                <Input variant="outline" size="lg" className="h-14 border-0 bg-transparent">
                  <InputSlot className="pl-5">
                    <InputIcon>
                      <Ionicons
                        name="location-outline"
                        size={22}
                        color={locationFocused ? theme.buttonPrimary : theme.textTertiary}
                      />
                    </InputIcon>
                  </InputSlot>
                  <InputField
                    placeholder={t("auth.locationPlaceholder")}
                    value={location}
                    onChangeText={(text: string) => updateField("location", text)}
                    onFocus={() => setLocationFocused(true)}
                    onBlur={() => setLocationFocused(false)}
                    editable={!isLoading}
                    placeholderTextColor={theme.textTertiary}
                    className="pl-3 pr-5 text-base"
                    style={{ color: theme.textPrimary }}
                  />
                </Input>
              </Box>
            </VStack>
          </FormControl>
        </VStack>

        {error && currentStep === 2 && (
          <Animated.View entering={FadeIn}>
            <Box
              className="rounded-xl border p-4 mt-4"
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
      </Box>
      )}

      {error && currentStep === 1 && (
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
