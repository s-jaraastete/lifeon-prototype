import { useCallback, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SignaturePad } from "@/components/SignaturePad";
import { useAuth } from "@/hooks/useAuth";
import { useNetworkOnline } from "@/hooks/useNetwork";
import {
  confirmDocumentReview,
  deliveryStatusLabel,
  fetchDeliveryById,
  markDocumentOpened,
  uploadSignatureAndRegister,
} from "@/services/deliveries";
import type { DocumentDelivery } from "@/types/models";
import { colors, spacing } from "@/theme/tokens";

const DECLARATION =
  "Declaro haber recibido, leído y comprendido el documento asignado. Me comprometo a cumplir con los procedimientos y medidas preventivas indicadas.";

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { member } = useAuth();
  const online = useNetworkOnline();
  const router = useRouter();
  const [delivery, setDelivery] = useState<DocumentDelivery | null>(null);
  const [step, setStep] = useState<"read" | "sign" | "done">("read");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!online || !id) return;
    setError(null);
    try {
      const row = await fetchDeliveryById(id);
      setDelivery(row);
      if (row?.status === "firmado") {
        setStep("done");
      } else {
        setStep("read");
        if (row && (row.status === "pendiente_revision" || row.status === "pendiente_firma")) {
          await markDocumentOpened(row.id);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar documento");
    }
  }, [online, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleContinueToSign = async () => {
    if (!delivery || !accepted) return;
    setLoading(true);
    setError(null);
    try {
      await confirmDocumentReview(delivery.id);
      setStep("sign");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al confirmar revisión");
    } finally {
      setLoading(false);
    }
  };

  const handleSignature = async (base64Png: string) => {
    if (!delivery || !member) return;
    setLoading(true);
    setError(null);
    try {
      await uploadSignatureAndRegister(delivery, member.authUserId, base64Png);
      setStep("done");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al registrar firma");
    } finally {
      setLoading(false);
    }
  };

  if (!online) {
    return <OfflineBanner />;
  }

  if (!delivery) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const snapshot = delivery.content_snapshot;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.title}>{delivery.title}</Text>
        <Text style={styles.meta}>Estado: {deliveryStatusLabel(delivery.status)}</Text>
        <Text style={styles.meta}>Código: {delivery.document_code ?? "—"}</Text>
        <Text style={styles.meta}>
          Asignado: {new Date(delivery.assigned_at).toLocaleDateString("es-CL")}
        </Text>
        <Text style={styles.meta}>Hash versión: {delivery.content_hash.slice(0, 12)}…</Text>
      </Card>

      <DocumentSnapshotBody snapshot={snapshot} />

      {step === "read" && delivery.status !== "firmado" ? (
        <View style={styles.block}>
          <View style={styles.switchRow}>
            <Switch value={accepted} onValueChange={setAccepted} />
            <Text style={styles.declaration}>{DECLARATION}</Text>
          </View>
          <PrimaryButton
            label="Continuar a firma"
            onPress={handleContinueToSign}
            disabled={!accepted}
            loading={loading}
          />
          <Text style={styles.legalNote}>
            Toma de conocimiento digital del prototipo LifeOn. No constituye firma
            electrónica avanzada.
          </Text>
        </View>
      ) : null}

      {step === "sign" && delivery.status !== "firmado" ? (
        <View style={styles.block}>
          <SignaturePad onConfirm={handleSignature} />
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
        </View>
      ) : null}

      {step === "done" || delivery.status === "firmado" ? (
        <Card>
          <Text style={styles.doneTitle}>Toma de conocimiento registrada</Text>
          {delivery.signed_at ? (
            <Text style={styles.meta}>
              Fecha: {new Date(delivery.signed_at).toLocaleString("es-CL")}
            </Text>
          ) : null}
          <PrimaryButton label="Volver a documentos" onPress={() => router.back()} />
        </Card>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

function DocumentSnapshotBody({ snapshot }: { snapshot: Record<string, unknown> }) {
  const kind = snapshot.kind as string | undefined;

  if (kind === "irl") {
    const evaluations = (snapshot.evaluations as Record<string, unknown>[]) ?? [];
    return (
      <View style={styles.block}>
        <Text style={styles.section}>Contenido IRL (versión enviada)</Text>
        <Text style={styles.meta}>Matriz: {String(snapshot.matrixTitle ?? "")}</Text>
        <Text style={styles.meta}>Cargo: {String(snapshot.cargoName ?? "")}</Text>
        {evaluations.map((ev, idx) => (
          <Card key={idx} style={styles.riskCard}>
            <Text style={styles.riskTitle}>{String(ev.task ?? "")}</Text>
            <Text style={styles.meta}>{String(ev.hazard ?? "")}</Text>
            <Text style={styles.meta}>{String(ev.controls ?? "")}</Text>
          </Card>
        ))}
      </View>
    );
  }

  if (kind === "technical_document") {
    const content = (snapshot.content as Record<string, string>) ?? {};
    const sections = Object.entries(content);
    return (
      <View style={styles.block}>
        <Text style={styles.section}>Contenido del documento</Text>
        {sections.map(([key, value]) => (
          <Card key={key} style={styles.riskCard}>
            <Text style={styles.riskTitle}>{key}</Text>
            <Text style={styles.meta}>{value}</Text>
          </Card>
        ))}
      </View>
    );
  }

  return (
    <Text style={styles.meta}>Contenido no disponible en formato reconocido.</Text>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: colors.text,
  },
  meta: {
    fontFamily: "Poppins_400Regular",
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },
  block: { gap: spacing.md },
  section: {
    fontFamily: "Poppins_600SemiBold",
    color: colors.text,
    fontSize: 16,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  declaration: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    color: colors.textMuted,
    lineHeight: 22,
  },
  legalNote: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },
  riskCard: { marginTop: spacing.sm },
  riskTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: colors.text,
  },
  doneTitle: {
    fontFamily: "Poppins_700Bold",
    color: colors.success,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.error,
    fontFamily: "Poppins_500Medium",
  },
});
