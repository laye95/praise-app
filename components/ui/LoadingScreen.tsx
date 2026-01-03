import { View, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { LinearGradient } from "expo-linear-gradient";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b", "#334155"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1 justify-center items-center">
        <VStack space="lg" className="items-center">
          <View className="relative">
            <View className="absolute inset-0 bg-primary-500/20 rounded-full blur-2xl w-24 h-24" />
            <View className="bg-background-50/10 rounded-full p-6 border border-primary-500/30">
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          </View>
          
          <Text className="text-typography-600 text-base font-medium">
            {message}
          </Text>
        </VStack>
      </View>
    </LinearGradient>
  );
}
