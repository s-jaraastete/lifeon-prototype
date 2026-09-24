import { Text, StyleSheet } from "react-native";
import { colors, spacing } from "@/theme/tokens";

export function OfflineBanner() {
  return (
    <Text style={styles.banner}>
      Sin conexión a internet. Conéctate para consultar tu IRL y documentos.
    </Text>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#FFF4E5",
    color: colors.text,
    padding: spacing.md,
    textAlign: "center",
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
  },
});
