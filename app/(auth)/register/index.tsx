import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { RegisterChurchForm } from "./_components/RegisterChurchForm";
import { RegisterHeader } from "./_components/RegisterHeader";
import { RegisterMemberForm } from "./_components/RegisterMemberForm";
import { RegistrationTypeSelector } from "./_components/RegistrationTypeSelector";
import { AuthTopBar } from "../_components/AuthTopBar";
import { useRegister } from "./_hooks/useRegister";

type RegistrationType = "church" | "member" | null;

export default function RegisterScreen() {
  const [registrationType, setRegistrationType] =
    useState<RegistrationType>(null);
  const [churchFormStep, setChurchFormStep] = useState(1);
  const [churchFormData, setChurchFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    churchName: "",
    denomination: "",
    location: "",
  });
  const { registerMember, registerChurch, isLoading, error } = useRegister();
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView 
      className="flex-1" 
      style={{ backgroundColor: theme.pageBg }}
      edges={["top", "left", "right"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <AuthTopBar
          showBackButton={registrationType !== null}
          onBack={() => setRegistrationType(null)}
        />
        {registrationType === null ? (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Box className="flex-1 px-6 py-6 justify-center">
              <Animated.View entering={FadeIn.duration(600)}>
                <RegisterHeader />
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(200).duration(600)}
              >
                <RegistrationTypeSelector
                  onSelect={(type) => setRegistrationType(type)}
                />
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(400).duration(600)}
                className="mt-8 items-center"
              >
                <HStack className="items-center gap-2">
                  <Text
                    className="text-sm"
                    style={{ color: theme.textSecondary }}
                  >
                    {t("auth.alreadyHaveAccount")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/(auth)/login")}
                    activeOpacity={0.7}
                  >
                    <Text
                      className="cursor-pointer text-sm font-semibold"
                      style={{ color: theme.buttonPrimary }}
                    >
                      {t("auth.signIn")}
                    </Text>
                  </TouchableOpacity>
                </HStack>
              </Animated.View>
            </Box>
          </ScrollView>
        ) : (
          <Box className="flex-1">
            <ScrollView
              contentContainerStyle={{ paddingBottom: 140 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Box className="px-6 pt-6">
                <Animated.View entering={FadeIn.duration(600)}>
                  <RegisterHeader />
                </Animated.View>

                <Animated.View
                  entering={FadeInDown.delay(200).duration(600)}
                >
                  {registrationType === "church" ? (
                    <RegisterChurchForm
                      onSubmit={registerChurch}
                      isLoading={isLoading}
                      error={error}
                      hideButton={true}
                      currentStep={churchFormStep}
                      onStepChange={setChurchFormStep}
                      formData={churchFormData}
                      onFormDataChange={setChurchFormData}
                    />
                  ) : (
                    <RegisterMemberForm
                      onSubmit={registerMember}
                      isLoading={isLoading}
                      error={error}
                      hideButton={true}
                    />
                  )}
                </Animated.View>
              </Box>
            </ScrollView>
            <Box
              className="absolute left-0 right-0 px-6 border-t"
              style={{
                backgroundColor: theme.pageBg,
                borderTopColor: theme.cardBorder,
                paddingTop: 12,
                paddingBottom: Math.max(insets.bottom, 4),
                bottom: 0,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              {registrationType === "church" ? (
                <RegisterChurchForm
                  onSubmit={registerChurch}
                  isLoading={isLoading}
                  error={error}
                  renderButtonOnly={true}
                  currentStep={churchFormStep}
                  onStepChange={setChurchFormStep}
                  formData={churchFormData}
                  onFormDataChange={setChurchFormData}
                />
              ) : (
                <RegisterMemberForm
                  onSubmit={registerMember}
                  isLoading={isLoading}
                  error={error}
                  renderButtonOnly={true}
                />
              )}
            </Box>
          </Box>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
