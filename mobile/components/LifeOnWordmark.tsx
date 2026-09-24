import { Text, StyleSheet } from "react-native";
import { colors } from "@/theme/tokens";

export function LifeOnWordmark({ size = "lg" }: { size?: "md" | "lg" }) {
  const fontSize = size === "lg" ? 32 : 24;
  return (
    <Text style={[styles.base, { fontSize }]}>
      <Text style={styles.life}>Life</Text>
      <Text style={styles.on}>On</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: "Poppins_700Bold",
  },
  life: {
    color: colors.primary,
    fontFamily: "Poppins_700Bold",
  },
  on: {
    color: colors.secondary,
    fontFamily: "Poppins_800ExtraBold",
  },
});
