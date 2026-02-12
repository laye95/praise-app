import { useTabNavDirection } from "@/contexts/TabNavDirectionContext";
import { useTheme } from "@/hooks/useTheme";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import Animated, {
  SlideInLeft,
  SlideInRight,
} from "react-native-reanimated";

interface AnimatedTabScreenProps {
  children: ReactNode;
}

export function AnimatedTabScreen({ children }: AnimatedTabScreenProps) {
  const { direction } = useTabNavDirection();
  const theme = useTheme();
  const [key, setKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setKey((k) => k + 1);
    }, [])
  );

  const entering = useMemo(() => {
    const slide = direction === "forward" ? SlideInRight : direction === "back" ? SlideInLeft : undefined;
    return slide?.duration(240);
  }, [direction]);

  return (
    <Animated.View
      key={key}
      entering={entering}
      style={{ flex: 1, backgroundColor: theme.pageBg }}
    >
      {children}
    </Animated.View>
  );
}
