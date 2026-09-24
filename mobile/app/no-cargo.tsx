import { View, Text, StyleSheet } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/hooks/useAuth";
import { colors, spacing } from "@/theme/tokens";

export default function NoCargoScreen() {
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cargo no asignado</Text>
      <Text style={styles.body}>
        Tu usuario no tiene un cargo asignado. Contacta al administrador de tu organización
        para que configure tu perfil antes de consultar tu IRL.
      </Text>
      <PrimaryButton label="Cerrar sesión" variant="outline" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: "center",
    gap: spacing.lg,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: colors.text,
  },
  body: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: colors.textMuted,
    lineHeight: 24,
  },
});
