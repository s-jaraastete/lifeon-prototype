import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "expo-router";
import { ArtpDocumentReview } from "@/components/ArtpDocumentReview";
import { ArtpSignedPdfViewer } from "@/components/ArtpSignedPdfViewer";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useNetworkOnline } from "@/hooks/useNetwork";
import { artpDocumentStatusLabel, fetchArtpVersionDetailMobile } from "@/services/artp";
import { normalizeDeliverySnapshot } from "@/utils/deliverySnapshot";
import { colors, spacing } from "@/theme/tokens";

export default function ArtpDocumentScreen() {
  const { versionId } = useLocalSearchParams<{ versionId: string }>();
  const online = useNetworkOnline();
  const [status, setStatus] = useState<string>("");
  const [taskName, setTaskName] = useState("");
  const [snapshot, setSnapshot] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!online || !versionId) return;
    setLoading(true);
    const detail = (await fetchArtpVersionDetailMobile(versionId)) as {
      version?: { status?: string; taskName?: string };
      content?: Record<string, unknown>;
    } | null;
    const content = detail?.content ?? {};
    setStatus(String(detail?.version?.status ?? ""));
    setTaskName(String(detail?.version?.taskName ?? "ARTP"));
    setSnapshot(normalizeDeliverySnapshot(content));
    setLoading(false);
  }, [online, versionId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  if (!online) return <OfflineBanner />;
  if (loading || !versionId) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.secondary} />
      </View>
    );
  }

  const vigente = status === "vigente";

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{taskName}</Text>
      <Text style={styles.status}>{artpDocumentStatusLabel(status)}</Text>
      {vigente ? (
        <ArtpSignedPdfViewer versionId={versionId} />
      ) : (
        <>
          <Text style={styles.note}>
            El PDF firmado estará disponible cuando todas las personas hayan firmado y el documento
            pase a vigente.
          </Text>
          {snapshot ? <ArtpDocumentReview snapshot={snapshot} /> : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Poppins_700Bold", fontSize: 20, color: colors.text },
  status: {
    fontFamily: "Poppins_600SemiBold",
    color: colors.secondary,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  note: {
    fontFamily: "Poppins_400Regular",
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
});
