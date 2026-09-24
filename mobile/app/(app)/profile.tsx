import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { OfflineBanner } from "@/components/OfflineBanner";
import { UserAvatar } from "@/components/UserAvatar";
import { TextField } from "@/components/TextField";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useNetworkOnline } from "@/hooks/useNetwork";
import { updateUserPassword } from "@/services/profile";
import { colors, radius, spacing } from "@/theme/tokens";

export default function ProfileScreen() {
  const { member, session, signOut } = useAuth();
  const { profile, setAvatar, clearAvatar } = useUserProfile(session?.user?.id);
  const online = useNetworkOnline();
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickAvatar = useCallback(async () => {
    if (!online) {
      setError("Conéctate a internet para cambiar tu foto.");
      return;
    }
    setError(null);
    setMessage(null);

    if (Platform.OS !== "web") {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError("Necesitamos permiso para acceder a tu galería.");
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setAvatarBusy(true);
    try {
      await setAvatar(asset.uri, asset.mimeType ?? "image/jpeg");
      setMessage("Foto de perfil actualizada.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la foto.");
    } finally {
      setAvatarBusy(false);
    }
  }, [online, setAvatar]);

  const handleRemoveAvatar = () => {
    Alert.alert("Quitar foto", "¿Volver al avatar por defecto?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Quitar",
        style: "destructive",
        onPress: async () => {
          setAvatarBusy(true);
          setError(null);
          try {
            await clearAvatar();
            setMessage("Foto eliminada.");
          } catch (e) {
            setError(e instanceof Error ? e.message : "No se pudo quitar la foto.");
          } finally {
            setAvatarBusy(false);
          }
        },
      },
    ]);
  };

  const handlePasswordChange = async () => {
    setError(null);
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setPasswordBusy(true);
    try {
      await updateUserPassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Contraseña actualizada correctamente.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cambiar la contraseña.");
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      {!online ? <OfflineBanner /> : null}

      <View style={styles.hero}>
        <UserAvatar
          name={member?.displayName ?? "Usuario"}
          imageUrl={profile?.avatarUrl}
          size={96}
          editable
          loading={avatarBusy}
          onPress={pickAvatar}
        />
        <Text style={styles.heroName}>{member?.displayName}</Text>
        <Text style={styles.heroEmail}>{member?.email}</Text>
        <View style={styles.avatarActions}>
          <PrimaryButton
            label="Cambiar foto"
            variant="outline"
            onPress={pickAvatar}
            loading={avatarBusy}
            disabled={!online}
          />
          {profile?.avatarUrl ? (
            <PrimaryButton
              label="Quitar foto"
              variant="outline"
              onPress={handleRemoveAvatar}
              disabled={avatarBusy || !online}
            />
          ) : null}
        </View>
      </View>

      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <Text style={styles.sectionTitle}>Tu cuenta</Text>
        <InfoRow label="Organización" value={member?.organizationName} />
        <InfoRow label="Cargo" value={member?.cargoName ?? "—"} />
        <InfoRow label="Centro de trabajo" value={member?.workCenterName ?? "—"} />
        <InfoRow label="Rol" value={member?.role} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Seguridad</Text>
        <Text style={styles.sectionHint}>
          Elige una contraseña de al menos 6 caracteres.
        </Text>
        <View style={styles.fieldGap}>
          <TextField
            label="Nueva contraseña"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            autoCapitalize="none"
          />
          <TextField
            label="Confirmar contraseña"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
          />
        </View>
        <PrimaryButton
          label="Actualizar contraseña"
          onPress={handlePasswordChange}
          loading={passwordBusy}
          disabled={!newPassword || !confirmPassword}
        />
      </Card>

      <PrimaryButton label="Cerrar sesión" variant="outline" onPress={signOut} />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value ?? "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  hero: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: colors.text,
  },
  heroEmail: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.textSecondary,
  },
  avatarActions: {
    width: "100%",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  fieldGap: { gap: spacing.md, marginBottom: spacing.md },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  infoRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: colors.textSecondary,
  },
  infoValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: colors.text,
    marginTop: 2,
  },
  success: {
    color: colors.secondary,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
  },
  error: {
    color: colors.error,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
  },
});
