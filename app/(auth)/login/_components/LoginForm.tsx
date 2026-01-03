import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { FormControl } from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import Animated, { FadeIn } from "react-native-reanimated";

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function LoginForm({ onSubmit, isLoading, error }: LoginFormProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

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

  const handleSubmit = async () => {
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) {
      return;
    }

    await onSubmit(email, password);
  };

  const isDark = theme.pageBg === "#0f172a";

  return (
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
      <VStack className="gap-6">
        <VStack className="gap-6">
          <FormControl isInvalid={!!emailError || !!error}>
            <VStack className="gap-2">
              <Text
                className="text-sm font-medium"
                style={{ color: theme.textSecondary }}
              >
                {t("auth.email")}
              </Text>
              <Box
                className="overflow-hidden rounded-2xl"
                style={{
                  backgroundColor: isDark ? theme.cardBg : "#ffffff",
                  borderWidth:
                    emailError || error ? 1.5 : emailFocused ? 1.5 : 1,
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
                <Input
                  variant="outline"
                  size="lg"
                  className="h-14 border-0 bg-transparent"
                >
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
                    onChangeText={(text) => {
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
                    style={{
                      color: theme.textPrimary,
                    }}
                  />
                </Input>
              </Box>
              {emailError && (
                <Animated.View entering={FadeIn}>
                  <HStack className="mt-1 items-center gap-1.5">
                    <Ionicons
                      name="close-circle"
                      size={14}
                      color={theme.buttonDecline}
                    />
                    <Text
                      className="text-xs"
                      style={{ color: theme.buttonDecline }}
                    >
                      {emailError}
                    </Text>
                  </HStack>
                </Animated.View>
              )}
            </VStack>
          </FormControl>

          <FormControl isInvalid={!!passwordError || !!error}>
            <VStack className="gap-2">
              <Text
                className="text-sm font-medium"
                style={{ color: theme.textSecondary }}
              >
                {t("auth.password")}
              </Text>
              <Box
                className="overflow-hidden rounded-2xl"
                style={{
                  backgroundColor: isDark ? theme.cardBg : "#ffffff",
                  borderWidth:
                    passwordError || error ? 1.5 : passwordFocused ? 1.5 : 1,
                  borderColor:
                    passwordError || error
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
                <Input
                  variant="outline"
                  size="lg"
                  className="h-14 border-0 bg-transparent"
                >
                  <InputSlot className="pl-5">
                    <InputIcon>
                      <Ionicons
                        name="lock-closed-outline"
                        size={22}
                        color={
                          passwordError || error
                            ? theme.buttonDecline
                            : passwordFocused
                              ? theme.buttonPrimary
                              : theme.textTertiary
                        }
                      />
                    </InputIcon>
                  </InputSlot>
                  <InputField
                    placeholder={t("auth.passwordPlaceholder")}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (passwordError) setPasswordError("");
                    }}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    editable={!isLoading}
                    placeholderTextColor={theme.textTertiary}
                    className="pl-3 pr-3 text-base"
                    style={{
                      color: theme.textPrimary,
                    }}
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
                    <Ionicons
                      name="close-circle"
                      size={14}
                      color={theme.buttonDecline}
                    />
                    <Text
                      className="text-xs"
                      style={{ color: theme.buttonDecline }}
                    >
                      {passwordError}
                    </Text>
                  </HStack>
                </Animated.View>
              )}
            </VStack>
          </FormControl>
        </VStack>

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
                <Ionicons
                  name="alert-circle"
                  size={18}
                  color={theme.buttonDecline}
                />
                <Text
                  className="flex-1 text-sm"
                  style={{ color: theme.textPrimary }}
                >
                  {error}
                </Text>
              </HStack>
            </Box>
          </Animated.View>
        )}

        <VStack className="mt-4 gap-4">
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
            <ButtonText
              className="text-base font-semibold"
              style={{ color: "#ffffff" }}
            >
              {isLoading ? t("auth.signingIn") : t("auth.signIn")}
            </ButtonText>
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
}
