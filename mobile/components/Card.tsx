import { View, StyleSheet, ViewProps } from "react-native";
import { colors, radius, shadow, spacing } from "@/theme/tokens";

interface CardProps extends ViewProps {
  elevated?: boolean;
}

export function Card({ style, elevated = true, ...props }: CardProps) {
  return <View style={[styles.card, elevated && shadow.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
});
