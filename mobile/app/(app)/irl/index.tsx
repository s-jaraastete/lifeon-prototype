import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Card } from "@/components/Card";
import { IrlDocumentScreen } from "@/components/IrlDocumentScreen";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useAuth } from "@/hooks/useAuth";
import { useNetworkOnline } from "@/hooks/useNetwork";
import { fetchMyIrl, irlScopeFromMember } from "@/services/irl";
import { toUserFacingError } from "@/utils/userFacingError";
import {
  pickPrimaryIrlEntry,
  shouldShowIrlPicker,
} from "@/utils/irlEntrySnapshot";
import type { IrlMatrixEntry } from "@/types/models";
import { colors, spacing } from "@/theme/tokens";

export default function IrlListScreen() {
  const online = useNetworkOnline();
  const { member } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<IrlMatrixEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!online || !member) return;
    setError(null);
    setLoading(true);
    try {
      setEntries(await fetchMyIrl(irlScopeFromMember(member)));
    } catch (e) {
      setError(toUserFacingError(e, "Error al cargar IRL"));
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [online, member?.memberId, member?.organizationId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const primary = pickPrimaryIrlEntry(entries);
  const showPicker = shouldShowIrlPicker(entries);

  if (!online) {
    return <OfflineBanner />;
  }

  if (loading && entries.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.secondary} />
        <Text style={styles.loadingText}>Cargando tu IRL…</Text>
      </View>
    );
  }

  if (primary && !showPicker) {
    return <IrlDocumentScreen entry={primary} member={member} />;
  }

  return (
    <View style={styles.flex}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={entries}
        keyExtractor={(item) => `${item.memberId}-${item.matrixId}`}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
        ListHeaderComponent={
          entries.length > 1 ? (
            <Text style={styles.listHint}>
              Hay más de un IRL aplicable a tu perfil. Elige el documento de tu cargo.
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No hay IRL disponible para tu cargo. Contacta al administrador si crees que
            deberías ver un documento.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(app)/irl/[matrixId]",
                params: { matrixId: item.matrixId },
              })
            }
          >
            <Card style={styles.card}>
              <Text style={styles.docKind}>Información de Riesgos Laborales (IRL)</Text>
              <Text style={styles.title}>IRL — {item.cargoName}</Text>
              <Text style={styles.meta}>Centro: {item.workCenterName || "—"}</Text>
              <Text style={styles.meta}>
                {item.evaluations.length} tarea(s) con peligros y controles
              </Text>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    color: colors.textSecondary,
  },
  list: { padding: spacing.lg, gap: spacing.md },
  listHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  card: { marginBottom: spacing.md },
  docKind: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.text,
    marginTop: 4,
  },
  meta: {
    fontFamily: "Poppins_400Regular",
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },
  empty: {
    padding: spacing.lg,
    textAlign: "center",
    color: colors.textSecondary,
    fontFamily: "Poppins_400Regular",
  },
  error: {
    color: colors.error,
    padding: spacing.md,
    fontFamily: "Poppins_500Medium",
  },
});
