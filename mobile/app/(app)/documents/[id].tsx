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
import { IrlDeliveryPdfViewer } from "@/components/IrlDeliveryPdfViewer";
import { useAuth } from "@/hooks/useAuth";
import { useOrgBranding } from "@/hooks/useOrgBranding";
import { useNetworkOnline } from "@/hooks/useNetwork";
import {
  confirmDocumentReview,
  deliveryStatusLabel,
  fetchDeliveryById,
  markDocumentOpened,
  uploadSignatureAndRegister,
} from "@/services/deliveries";
import type { DocumentDelivery } from "@/types/models";
import { useTabBarPadding } from "@/hooks/useTabBarPadding";
import { isIrlDelivery, normalizeDeliverySnapshot } from "@/utils/deliverySnapshot";
import { parseIrlSnapshot } from "@/utils/irlDocumentCopy";
import { resolveOrganizationDisplayName } from "@/utils/organizationDisplayName";
import { colors, spacing } from "@/theme/tokens";

const DECLARATION =
  "Declaro haber recibido, leído y comprendido el documento asignado. Me comprometo a cumplir con los procedimientos y medidas preventivas indicadas.";

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { member } = useAuth();
  const { branding } = useOrgBranding(member?.organizationId);
  const online = useNetworkOnline();
  const router = useRouter();
  const [delivery, setDelivery] = useState<DocumentDelivery | null>(null);
  const [step, setStep] = useState<"read" | "sign" | "done">("read");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tabBarPad = useTabBarPadding();

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

  const snapshot = normalizeDeliverySnapshot(delivery.content_snapshot);
  const isIrl = isIrlDelivery(delivery);
  const parsedIrl = isIrl ? parseIrlSnapshot(snapshot) : null;
  const orgName = resolveOrganizationDisplayName(branding?.name, parsedIrl?.organizationName);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarPad }]}
    >
      <Card style={styles.docMeta}>
        <Text style={styles.docMetaLabel}>Documento asignado</Text>
        <Text style={styles.title}>{delivery.title}</Text>
        <Text style={styles.meta}>Estado: {deliveryStatusLabel(delivery.status)}</Text>
        <Text style={styles.meta}>Código: {delivery.document_code ?? "—"}</Text>
        <Text style={styles.meta}>
          Asignado: {new Date(delivery.assigned_at).toLocaleDateString("es-CL")}
        </Text>
      </Card>

      {isIrl ? (
        <IrlDeliveryPdfViewer deliveryId={delivery.id} minHeight={560} />
      ) : (
        <TechnicalSnapshotBody snapshot={snapshot} />
      )}

      {step === "sign" && delivery.status !== "firmado" && isIrl ? (
        <View style={styles.block}>
          <Text style={styles.section}>Firma del trabajador</Text>
          <SignaturePad onConfirm={handleSignature} />
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
        </View>
      ) : null}

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
            Toma de conocimiento digital registrada por {orgName ?? "la empresa"}. No constituye
            firma electrónica avanzada.
          </Text>
        </View>
      ) : null}

      {step === "sign" && delivery.status !== "firmado" && !isIrl ? (
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

function TechnicalSnapshotBody({ snapshot }: { snapshot: Record<string, unknown> }) {
  if (snapshot.kind !== "technical_document") {
    return (
      <Text style={styles.meta}>Contenido no disponible en formato reconocido.</Text>
    );
  }
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

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  docMeta: { gap: 2 },
  docMetaLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
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
