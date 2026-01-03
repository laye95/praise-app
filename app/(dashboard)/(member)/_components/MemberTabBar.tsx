import { Text } from "@/components/ui/text";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { TouchableOpacity, View, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useRef, useMemo } from "react";
import * as Haptics from "expo-haptics";

export function MemberTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.pageBg === "#0f172a";
  const previousIndex = useRef(state.index);
  const scaleAnims = useRef<Record<string, Animated.Value>>({}).current;

  state.routes.forEach((route) => {
    if (!scaleAnims[route.key]) {
      scaleAnims[route.key] = new Animated.Value(1);
    }
  });

  useEffect(() => {
    if (previousIndex.current !== state.index) {
      const prevRoute = state.routes[previousIndex.current];
      const newRoute = state.routes[state.index];

      if (prevRoute && newRoute) {
        Animated.parallel([
          Animated.spring(scaleAnims[prevRoute.key], {
            toValue: 1,
            useNativeDriver: true,
            tension: 300,
            friction: 20,
          }),
          Animated.spring(scaleAnims[newRoute.key], {
            toValue: 1.15,
            useNativeDriver: true,
            tension: 300,
            friction: 20,
          }),
        ]).start(() => {
          Animated.spring(scaleAnims[newRoute.key], {
            toValue: 1,
            useNativeDriver: true,
            tension: 300,
            friction: 20,
          }).start();
        });
      }

      previousIndex.current = state.index;
    }
  }, [state.index, state.routes, scaleAnims]);

  const backgroundColor = theme.cardBg;
  const inactiveIconColor = theme.tabInactiveText;
  const inactiveTextColor = theme.tabInactiveText;
  const activeTextColor = "#ffffff";
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";

  const tabConfig: Record<
    string,
    { icon: keyof typeof Ionicons.glyphMap; label: string }
  > = useMemo(
    () => ({
      "find-church": { icon: "search", label: t("navbar.find") },
      applications: { icon: "mail", label: t("navbar.applications") },
      settings: { icon: "settings", label: t("navbar.settings") },
    }),
    [t]
  );

  const routeOrder = ["find-church", "applications", "settings"];
  const sortedRoutes = [...state.routes].sort((a, b) => {
    const aParts = a.name.split("/");
    const bParts = b.name.split("/");
    let aName = aParts[aParts.length - 1];
    let bName = bParts[bParts.length - 1];
    
    if (aName === "index") {
      aName = aParts[aParts.length - 2] || aName;
    }
    if (bName === "index") {
      bName = bParts[bParts.length - 2] || bName;
    }
    
    const aIndex = routeOrder.indexOf(aName);
    const bIndex = routeOrder.indexOf(bName);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  return (
    <View
      style={{
        position: "absolute",
        bottom: insets.bottom,
        left: 16,
        right: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          backgroundColor,
          borderRadius: 24,
          paddingVertical: 4,
          paddingHorizontal: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.25 : 0.1,
          shadowRadius: 24,
          elevation: 12,
          borderWidth: 1,
          borderColor,
        }}
      >
        {sortedRoutes.map((route, index) => {
          const originalIndex = state.routes.findIndex((r) => r.key === route.key);
          const { options } = descriptors[route.key];
          const isFocused = state.index === originalIndex;
          const routeParts = route.name.split("/");
          let routeName = routeParts[routeParts.length - 1];
          if (routeName === "index") {
            routeName = routeParts[routeParts.length - 2] || routeParts[routeParts.length - 1];
          }
          const config = tabConfig[routeName] || {
            icon: "ellipse",
            label: routeName,
          };

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate(route.name as never);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              activeOpacity={0.7}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 4,
                paddingHorizontal: 0,
              }}
            >
              {isFocused ? (
                <Animated.View
                  style={{
                    transform: [{ scale: scaleAnims[route.key] || 1 }],
                    width: "100%",
                  }}
                >
                  <LinearGradient
                    colors={[theme.buttonPrimary, theme.buttonPrimary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 16,
                      paddingVertical: 8,
                      paddingHorizontal: 8,
                      shadowColor: theme.buttonPrimary,
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.25,
                      shadowRadius: 6,
                      elevation: 6,
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 3,
                      width: "100%",
                    }}
                  >
                    <View style={{ height: 20, justifyContent: "center" }}>
                      <Ionicons name={config.icon} size={20} color="#ffffff" />
                    </View>
                    <View style={{ height: 12, justifyContent: "center" }}>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "600",
                          color: "#ffffff",
                          lineHeight: 12,
                        }}
                      >
                        {config.label}
                      </Text>
                    </View>
                  </LinearGradient>
                </Animated.View>
              ) : (
                <Animated.View
                  style={{
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    opacity: scaleAnims[route.key]?.interpolate({
                      inputRange: [0.9, 1],
                      outputRange: [0.6, 1],
                      extrapolate: "clamp",
                    }) || 1,
                  }}
                >
                  <View style={{ height: 20, justifyContent: "center" }}>
                    <Ionicons
                      name={
                        `${config.icon}-outline` as keyof typeof Ionicons.glyphMap
                      }
                      size={20}
                      color={inactiveIconColor}
                    />
                  </View>
                  <View style={{ height: 12, justifyContent: "center" }}>
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "500",
                        color: inactiveTextColor,
                        lineHeight: 12,
                      }}
                    >
                      {config.label}
                    </Text>
                  </View>
                </Animated.View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
