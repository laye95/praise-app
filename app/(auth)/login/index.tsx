import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useLogin } from "./_hooks/useLogin";
import { LoginForm } from "./_components/LoginForm";
import { LoginHeader } from "./_components/LoginHeader";
import { AuthTopBar } from "../_components/AuthTopBar";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

export default function LoginScreen() {
  const { login, isLoading, error } = useLogin();
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <AuthTopBar />
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Box className="flex-1 px-6 py-6 justify-center">
            <Animated.View entering={FadeIn.duration(600)}>
              <LoginHeader />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(600)}>
              <LoginForm onSubmit={login} isLoading={isLoading} error={error} />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(400).duration(600)}
              className="mt-8 items-center"
            >
              <HStack className="items-center gap-2">
                <Text className="text-sm" style={{ color: theme.textSecondary }}>
                  {t("auth.noAccount")}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/register")}
                  activeOpacity={0.7}
                  className="cursor-pointer"
                >
                  <Text className="text-sm font-semibold" style={{ color: theme.buttonPrimary }}>
                    {t("auth.signUp")}
                  </Text>
                </TouchableOpacity>
              </HStack>
            </Animated.View>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
