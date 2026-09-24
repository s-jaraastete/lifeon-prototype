import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  PressableProps,
} from "react-native";
import { colors, radius, spacing } from "@/theme/tokens";

interface PrimaryButtonProps extends PressableProps {
  label: string;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline";
}

export function PrimaryButton({
  label,
  loading,
  variant = "primary",
  disabled,
  ...props
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "outline" && styles.outline,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? colors.primary : "#fff"} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === "outline" && styles.outlineLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  outlineLabel: {
    color: colors.textMuted,
  },
});
