import { View, ViewProps } from "react-native";
import { forwardRef, ReactNode } from "react";

interface CardProps extends ViewProps {
  children: ReactNode;
  variant?: "default" | "elevated";
}

export const Card = forwardRef<View, CardProps>(
  ({ children, variant = "default", className = "", style, ...rest }, ref) => {
    const baseClassName = "rounded-2xl bg-background-50 p-6";
    const variantClassName = variant === "elevated" ? "border border-outline-100" : "";
    const combinedClassName = `${baseClassName} ${variantClassName} ${className}`.trim();

    return (
      <View ref={ref} className={combinedClassName} style={style} {...rest}>
        {children}
      </View>
    );
  }
);
