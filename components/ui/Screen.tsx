import { SafeAreaView } from "react-native-safe-area-context";
import { View, ViewProps } from "react-native";
import { forwardRef, ReactNode } from "react";

interface ScreenProps extends ViewProps {
  children: ReactNode;
  safeArea?: boolean;
  padding?: boolean;
}

export const Screen = forwardRef<View, ScreenProps>(
  ({ children, safeArea = true, padding = true, className = "", style, ...rest }, ref) => {
    const combinedClassName = `flex-1 bg-background-0 ${padding ? "px-6 py-4" : ""} ${className}`.trim();

    if (safeArea) {
      return (
        <SafeAreaView style={{ flex: 1 }} className="bg-background-0">
          <View ref={ref} className={combinedClassName} style={style} {...rest}>
            {children}
          </View>
        </SafeAreaView>
      );
    }

    return (
      <View ref={ref} className={combinedClassName} style={style} {...rest}>
        {children}
      </View>
    );
  }
);
