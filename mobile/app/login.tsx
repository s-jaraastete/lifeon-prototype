import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LifeOnWordmark } from "@/components/LifeOnWordmark";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/hooks/useAuth";
import { colors, spacing, radius } from "@/theme/tokens";

export default function LoginScreen() {
  const { signIn, configError, gateError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    const message = await signIn(email, password);
    setLoading(false);
    if (message) setError(message);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <LifeOnWordmark />
        <Text style={styles.subtitle}>Acceso para trabajadores</Text>

        {configError ? <Text style={styles.error}>{configError}</Text> : null}
        {gateError ? <Text style={styles.error}>{gateError}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton label="Iniciar sesión" onPress={handleSubmit} loading={loading} />

        <Text style={styles.footer}>
          Si no tienes acceso, contacta al administrador de tu organización.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: "center",
    gap: spacing.md,
  },
  subtitle: {
    fontFamily: "Poppins_500Medium",
    color: colors.textMuted,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: colors.text,
  },
  error: {
    color: colors.error,
    fontFamily: "Poppins_500Medium",
  },
  footer: {
    marginTop: spacing.md,
    textAlign: "center",
    color: colors.textSecondary,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
  },
});
