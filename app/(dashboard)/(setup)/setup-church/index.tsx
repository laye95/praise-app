import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/api/authService";
import { AppError } from "@/services/api/baseService";
import { churchService } from "@/services/api/churchService";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, TouchableOpacity } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SetupChurchScreen() {
  const { user } = useAuth();
  const [churchName, setChurchName] = useState("");
  const [denomination, setDenomination] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateChurch = async () => {
    if (!churchName.trim()) {
      setError("Church name is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const church = await churchService.createChurch({
        name: churchName.trim(),
        denomination: denomination.trim() || undefined,
        location: location.trim() || undefined,
        timezone: "UTC",
      });

      if (user?.id) {
        await authService
          .getSupabaseClient()
          .from("users")
          .update({
            role: "church_admin",
            church_id: church.id,
          })
          .eq("id", user.id);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(dashboard)/(church)/home");
    } catch (err) {
      let errorMessage = "Failed to create church. Please try again.";

      if (err instanceof AppError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <Box className="flex-1 px-6 py-4">
        <HStack className="mb-8 items-center justify-between">
          <VStack className="flex-1">
            <Heading className="text-3xl font-bold text-typography-950">
              Complete Your Setup
            </Heading>
            <Text className="mt-1 text-sm text-typography-600">
              Create your church to continue
            </Text>
          </VStack>
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            className="cursor-pointer"
          >
            <Box className="rounded-xl border border-error-200 bg-error-50 p-3">
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            </Box>
          </TouchableOpacity>
        </HStack>

        <Animated.View entering={FadeInDown.duration(500)}>
          <Box className="rounded-2xl border border-outline-100 bg-background-50 p-6">
            <VStack className="gap-4">
              <HStack className="mb-2 items-center gap-3">
                <Box className="rounded-xl bg-primary-100 p-3">
                  <Ionicons name="business" size={24} color="#6366f1" />
                </Box>
                <VStack className="flex-1">
                  <Text className="text-lg font-bold text-typography-950">
                    Church Information
                  </Text>
                  <Text className="text-sm text-typography-600">
                    Set up your church profile
                  </Text>
                </VStack>
              </HStack>

              {error ? (
                <Box className="rounded-lg border-l-4 border-error-500 bg-error-50 p-4">
                  <HStack className="items-start gap-2">
                    <Ionicons name="alert-circle" size={20} color="#ef4444" />
                    <Text className="flex-1 text-sm font-medium text-error-900">
                      {error}
                    </Text>
                  </HStack>
                </Box>
              ) : null}

              <VStack className="gap-2">
                <Text className="text-sm font-medium text-typography-950">
                  Church Name *
                </Text>
                <Input variant="outline" size="lg">
                  <InputField
                    placeholder="Enter church name"
                    value={churchName}
                    onChangeText={setChurchName}
                    editable={!isLoading}
                  />
                </Input>
              </VStack>

              <VStack className="gap-2">
                <Text className="text-sm font-medium text-typography-950">
                  Denomination (Optional)
                </Text>
                <Input variant="outline" size="lg">
                  <InputField
                    placeholder="e.g., Baptist, Methodist, Non-denominational"
                    value={denomination}
                    onChangeText={setDenomination}
                    editable={!isLoading}
                  />
                </Input>
              </VStack>

              <VStack className="gap-2">
                <Text className="text-sm font-medium text-typography-950">
                  Location (Optional)
                </Text>
                <Input variant="outline" size="lg">
                  <InputField
                    placeholder="City, State/Country"
                    value={location}
                    onChangeText={setLocation}
                    editable={!isLoading}
                  />
                </Input>
              </VStack>

              <Button
                size="lg"
                onPress={handleCreateChurch}
                disabled={isLoading || !churchName.trim()}
                className="mt-4 cursor-pointer"
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <ButtonText>Create Church</ButtonText>
                )}
              </Button>
            </VStack>
          </Box>
        </Animated.View>

        <Box className="mt-6 rounded-2xl border-l-4 border-info-500 bg-info-50 p-5">
          <HStack className="items-start gap-3">
            <Ionicons name="information-circle" size={22} color="#3b82f6" />
            <VStack className="flex-1 gap-1">
              <Text className="text-sm font-semibold text-info-900">
                Almost there!
              </Text>
              <Text className="text-xs text-info-800">
                Complete your church setup to access the full dashboard and
                start managing your church community.
              </Text>
            </VStack>
          </HStack>
        </Box>
      </Box>
    </SafeAreaView>
  );
}
