import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useNetworkOnline } from "@/hooks/useNetwork";
import { OfflineBanner } from "@/components/OfflineBanner";
import {
  artpDocumentStatusLabel,
  fetchMyArtpDocuments,
  type MyArtpDocument,
} from "@/services/artp";
import { colors } from "@/theme/tokens";

export default function ArtpListScreen() {
  const { member } = useAuth();
  const online = useNetworkOnline();
  const router = useRouter();
  const [items, setItems] = useState<MyArtpDocument[]>([]);
  const [filter, setFilter] = useState<"all" | "en_revision" | "vigente">("all");

  const load = useCallback(() => {
    if (!member?.organizationId || !online) return;
    void fetchMyArtpDocuments().then(setItems);
  }, [member?.organizationId, online]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!online) {
    return <OfflineBanner />;
  }

  const filtered =
    filter === "all" ? items : items.filter((item) => item.documentStatus === filter);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mis ARTP</Text>
      <View style={styles.filters}>
        {(
          [
            ["all", "Todos"],
            ["en_revision", "Pendiente de firmas"],
            ["vigente", "Vigente"],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => setFilter(key)}
            style={[styles.chip, filter === key && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === key && styles.chipTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {filtered.length === 0 ? (
        <Text style={styles.empty}>No hay documentos ARTP asignados.</Text>
      ) : (
        filtered.map((doc) => {
          const pendingMine =
            doc.mySignatureStatus === "pendiente_revision" ||
            doc.mySignatureStatus === "pendiente_firma";
          return (
            <Pressable
              key={doc.deliveryId}
              style={styles.card}
              onPress={() => {
                if (pendingMine) {
                  router.push({
                    pathname: "/(app)/documents/[id]",
                    params: { id: doc.deliveryId },
                  });
                  return;
                }
                router.push({
                  pathname: "/(app)/artp/doc/[versionId]",
                  params: { versionId: doc.versionId },
                });
              }}
            >
              <Text style={styles.cardCode}>{doc.taskName}</Text>
              <Text style={styles.cardStatus}>{artpDocumentStatusLabel(doc.documentStatus)}</Text>
              <Text style={styles.cardMeta}>
                {pendingMine
                  ? "Tu firma está pendiente"
                  : doc.mySignatureStatus === "firmado" && doc.documentStatus !== "vigente"
                    ? "Ya firmaste · esperando al resto"
                    : doc.documentStatus === "vigente"
                      ? "Documento firmado"
                      : doc.assigneeRole === "supervisor"
                        ? "Supervisor"
                        : "Participante"}
              </Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: colors.text,
    marginBottom: 12,
  },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  chipText: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: colors.textSecondary },
  chipTextActive: { color: "#fff" },
  empty: { fontFamily: "Poppins_400Regular", color: colors.textSecondary, marginTop: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardCode: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.text },
  cardStatus: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: colors.secondary,
    marginTop: 4,
  },
  cardMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
