import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Card } from "@/components/Card";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useNetworkOnline } from "@/hooks/useNetwork";
import { fetchMyIrl } from "@/services/irl";
import type { IrlMatrixEntry } from "@/types/models";
import { colors, spacing } from "@/theme/tokens";

export default function IrlListScreen() {
  const online = useNetworkOnline();
  const router = useRouter();
  const [entries, setEntries] = useState<IrlMatrixEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!online) return;
    setError(null);
    try {
      setEntries(await fetchMyIrl());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar IRL");
    }
  }, [online]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.flex}>
      {!online ? <OfflineBanner /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={entries}
        keyExtractor={(item) => item.matrixId}
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
        ListEmptyComponent={
          <Text style={styles.empty}>
            No hay matrices vigentes aplicables a tu cargo. Contacta al administrador si
            crees que deberías ver una IRL.
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
              <Text style={styles.code}>{item.matrixCode}</Text>
              <Text style={styles.title}>{item.matrixTitle}</Text>
              <Text style={styles.meta}>Centro: {item.workCenterName || "—"}</Text>
              <Text style={styles.meta}>Cargo: {item.cargoName}</Text>
              <Text style={styles.meta}>
                {item.evaluations.length} riesgo(s) · Vigente
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
  list: { padding: spacing.lg, gap: spacing.md },
  card: { marginBottom: spacing.md },
  code: {
    fontFamily: "Poppins_600SemiBold",
    color: colors.secondary,
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
