import { useCallback, useState } from "react";
import { Text, StyleSheet, View, ActivityIndicator } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { IrlDocumentScreen } from "@/components/IrlDocumentScreen";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useAuth } from "@/hooks/useAuth";
import { useNetworkOnline } from "@/hooks/useNetwork";
import { fetchMyIrl, findIrlEntryByMatrixId, irlScopeFromMember } from "@/services/irl";
import type { IrlMatrixEntry } from "@/types/models";
import { colors, spacing } from "@/theme/tokens";

export default function IrlDetailScreen() {
  const { matrixId } = useLocalSearchParams<{ matrixId: string }>();
  const { member } = useAuth();
  const online = useNetworkOnline();
  const [entry, setEntry] = useState<IrlMatrixEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!online || !matrixId || !member) return;
    setError(null);
    setLoading(true);
    try {
      const all = await fetchMyIrl(irlScopeFromMember(member));
      setEntry(findIrlEntryByMatrixId(all, matrixId) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar IRL");
      setEntry(null);
    } finally {
      setLoading(false);
    }
  }, [online, matrixId, member?.memberId, member?.organizationId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!online) {
    return <OfflineBanner />;
  }

  if (loading && !entry) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.secondary} />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>
          {error ?? "No se encontró el IRL de tu cargo."}
        </Text>
      </View>
    );
  }

  return <IrlDocumentScreen entry={entry} member={member} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", padding: spacing.lg },
  empty: {
    textAlign: "center",
    color: colors.textSecondary,
    fontFamily: "Poppins_400Regular",
  },
});
