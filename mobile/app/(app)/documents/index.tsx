import { useCallback, useMemo, useState } from "react";
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
import {
  deliveryStatusLabel,
  fetchMyDeliveries,
  isPending,
} from "@/services/deliveries";
import { toUserFacingError } from "@/utils/userFacingError";
import type { DocumentDelivery } from "@/types/models";
import { colors, spacing } from "@/theme/tokens";

type Segment = "pendientes" | "firmados" | "historial";

export default function DocumentsScreen() {
  const online = useNetworkOnline();
  const router = useRouter();
  const [segment, setSegment] = useState<Segment>("pendientes");
  const [deliveries, setDeliveries] = useState<DocumentDelivery[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!online) return;
    setError(null);
    try {
      setDeliveries(await fetchMyDeliveries());
    } catch (e) {
      setError(toUserFacingError(e, "Error al cargar documentos"));
    }
  }, [online]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    if (segment === "pendientes") {
      return deliveries.filter((d) => isPending(d.status));
    }
    if (segment === "firmados") {
      return deliveries.filter((d) => d.status === "firmado");
    }
    return deliveries;
  }, [deliveries, segment]);

  return (
    <View style={styles.flex}>
      {!online ? <OfflineBanner /> : null}
      <View style={styles.segments}>
        {(["pendientes", "firmados", "historial"] as Segment[]).map((key) => (
          <Pressable
            key={key}
            style={[styles.segment, segment === key && styles.segmentActive]}
            onPress={() => setSegment(key)}
          >
            <Text style={[styles.segmentText, segment === key && styles.segmentTextActive]}>
              {key === "pendientes"
                ? "Pendientes"
                : key === "firmados"
                  ? "Firmados"
                  : "Historial"}
            </Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
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
          <Text style={styles.empty}>No hay documentos en esta sección.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(app)/documents/[id]",
                params: { id: item.id },
              })
            }
          >
            <Card style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{deliveryStatusLabel(item.status)}</Text>
              <Text style={styles.meta}>
                Asignado: {new Date(item.assigned_at).toLocaleDateString("es-CL")}
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
  segments: {
    flexDirection: "row",
    padding: spacing.md,
    gap: spacing.sm,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  segmentText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: "#fff",
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  card: { marginBottom: spacing.md },
  title: {
    fontFamily: "Poppins_600SemiBold",
    color: colors.text,
    fontSize: 15,
  },
  meta: {
    fontFamily: "Poppins_400Regular",
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },
  empty: {
    textAlign: "center",
    padding: spacing.lg,
    color: colors.textSecondary,
    fontFamily: "Poppins_400Regular",
  },
  error: {
    color: colors.error,
    paddingHorizontal: spacing.lg,
    fontFamily: "Poppins_500Medium",
  },
});
