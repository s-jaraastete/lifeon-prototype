import type { ReactNode } from "react";
import { View, Text, StyleSheet, Image, Platform } from "react-native";
import { Card } from "@/components/Card";
import { IrlEvaluationCard } from "@/components/IrlEvaluationCard";
import { evaluationFromSnapshotRow } from "@/utils/snapshotEvaluations";
import {
  IRL_LEGAL_BADGE,
  IRL_LEGAL_SUBTITLE,
  IRL_OBLIGATION_BODY,
  IRL_OBLIGATION_TITLE,
  IRL_WORKER_DECLARATION_INTRO,
  IRL_WORKER_DECLARATION_OUTRO,
  buildIrlDocumentCode,
  parseIrlSnapshot,
} from "@/utils/irlDocumentCopy";
import { colors, spacing, radius } from "@/theme/tokens";

type WorkerSignature = {
  fullName?: string;
  identificationNumber?: string | null;
  signedAt?: string | null;
  imageUrl?: string | null;
};

type Props = {
  snapshot: Record<string, unknown>;
  workerSignature?: WorkerSignature;
  fallbackOrganizationName?: string;
  fallbackOrganizationLogoUrl?: string | null;
  signatureCapture?: ReactNode;
  /** Hoja formal tipo PDF (Documentos). */
  variant?: "formal" | "inline";
};

export function IrlFormalDocumentView({
  snapshot,
  workerSignature,
  fallbackOrganizationName,
  fallbackOrganizationLogoUrl,
  signatureCapture,
  variant = "inline",
}: Props) {
  const parsed = parseIrlSnapshot(snapshot);
  const organizationName =
    parsed.organizationName?.trim() ||
    fallbackOrganizationName?.trim() ||
    "Empresa";
  const logoUrl = parsed.organizationLogoUrl ?? fallbackOrganizationLogoUrl ?? null;
  const matrixCode = parsed.matrixCode ?? "—";
  const matrixTitle = parsed.matrixTitle ?? "Matriz IPER";
  const cargoName = parsed.cargoName ?? "—";
  const code =
    parsed.documentCode ?? buildIrlDocumentCode(matrixCode, cargoName);
  const issuedAt = parsed.issuedAt
    ? new Date(parsed.issuedAt).toLocaleDateString("es-CL")
    : new Date().toLocaleDateString("es-CL");

  const workerName =
    workerSignature?.fullName?.trim() ||
    parsed.assigneeFullName?.trim() ||
    "_____________________________________";
  const workerRut =
    workerSignature?.identificationNumber?.trim() ||
    parsed.assigneeIdentificationNumber?.trim() ||
    "____________________";
  const signedDate = workerSignature?.signedAt
    ? new Date(workerSignature.signedAt).toLocaleDateString("es-CL")
    : "___/___/______";

  const evaluations = parsed.evaluations ?? [];

  return (
    <View style={[styles.a4Sheet, variant === "formal" && styles.a4SheetFormal]}>
      <View style={styles.headerBlock}>
        <View style={styles.headerGrid}>
          <View style={styles.headerLeft}>
            {logoUrl ? (
              <View style={styles.logoWrap}>
                <Image
                  source={{ uri: logoUrl }}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            ) : null}
            <View style={styles.headerText}>
              <Text style={styles.orgName}>{organizationName}</Text>
              <Text style={styles.mainTitle}>INFORMACIÓN DE RIESGOS LABORALES (IRL)</Text>
              <Text style={styles.legalSubtitle}>{IRL_LEGAL_SUBTITLE}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{IRL_LEGAL_BADGE}</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.metaLine}>
              <Text style={styles.metaLabel}>Código Doc:{"\n"}</Text>
              <Text style={styles.metaValue}>{code}</Text>
            </Text>
            <Text style={[styles.metaLine, styles.metaSpaced]}>
              <Text style={styles.metaLabel}>Ref. IPER:{"\n"}</Text>
              <Text style={styles.metaValue}>{matrixCode}</Text>
            </Text>
            <Text style={[styles.metaLine, styles.metaSpaced]}>
              <Text style={styles.metaLabel}>Fecha Emisión:{"\n"}</Text>
              <Text style={styles.metaValue}>{issuedAt}</Text>
            </Text>
          </View>
        </View>
      </View>

      <Card style={styles.infoCard}>
        <InfoRow label="Empresa / Razón Social" value={organizationName} />
        <InfoRow label="Centro de trabajo" value={parsed.workCenterName || "—"} />
        <InfoRow label="Cargo evaluado" value={cargoName} highlight />
        <InfoRow label="APR / Prevención" value={parsed.responsible || "—"} />
      </Card>

      <View style={styles.obligationBox}>
        <Text style={styles.obligationTitle}>{IRL_OBLIGATION_TITLE}</Text>
        <Text style={styles.obligationBody}>{IRL_OBLIGATION_BODY}</Text>
      </View>

      <Text style={styles.sectionTitle}>
        1. Tareas, peligros, riesgos y medidas de control ({evaluations.length})
      </Text>
      <Text style={styles.sectionHint}>
        Por cada tarea: peligro identificado, riesgo asociado y medidas para gestionarlo.
      </Text>
      {evaluations.map((ev, idx) => (
        <IrlEvaluationCard
          key={String(ev.id ?? idx)}
          evaluation={evaluationFromSnapshotRow(ev)}
          index={idx}
        />
      ))}

      <Card style={styles.eppCard}>
        <Text style={styles.sectionTitleSmall}>2. EPP de uso obligatorio</Text>
        <Text style={styles.eppHint}>
          Según procedimientos del centro de trabajo y la matriz IPER vigente.
        </Text>
      </Card>

      <Card style={styles.signCard}>
        <Text style={styles.sectionTitleSmall}>3. Declaración y firma del trabajador</Text>
        <Text style={styles.declaration}>
          {IRL_WORKER_DECLARATION_INTRO} <Text style={styles.bold}>{cargoName}</Text>.{" "}
          {IRL_WORKER_DECLARATION_OUTRO}
        </Text>

        <Text style={styles.signLabel}>FIRMA DEL TRABAJADOR / TRABAJADORA</Text>
        {workerSignature?.imageUrl ? (
          <Image
            source={{ uri: workerSignature.imageUrl }}
            style={styles.signatureImage}
            resizeMode="contain"
          />
        ) : (
          <>
            <View style={styles.signaturePlaceholder} />
            {signatureCapture ? (
              <View style={styles.captureWrap}>{signatureCapture}</View>
            ) : null}
          </>
        )}
        <Text style={styles.signMeta}>Nombre: {workerName}</Text>
        <Text style={styles.signMeta}>
          RUT/ID: {workerRut} · Fecha: {signedDate}
        </Text>

        <View style={styles.aprBlock}>
          <Text style={styles.signLabel}>POR LA EMPRESA / PREVENCIONISTA (APR)</Text>
          <Text style={styles.signMeta}>{parsed.responsible || "—"}</Text>
        </View>
      </Card>

      <Text style={styles.sourceFootnote}>
        Documento IRL del cargo · Referencia técnica: Matriz IPER {matrixCode}
      </Text>
    </View>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  a4Sheet: {
    width: "100%",
    maxWidth: 794,
    alignSelf: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: spacing.md,
    minHeight: 900,
  },
  a4SheetFormal: {
    maxWidth: "100%",
    minHeight: 960,
    paddingHorizontal: 22,
    paddingVertical: 28,
    borderColor: "#D1D5DB",
    ...(Platform.OS === "web"
      ? ({
          boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        } as object)
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 6,
        }),
  },
  headerBlock: {
    borderBottomWidth: 2,
    borderBottomColor: "#111827",
    paddingBottom: spacing.md,
  },
  headerGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    minWidth: 0,
    paddingRight: spacing.xs,
  },
  headerMeta: {
    alignItems: "flex-end",
    flexShrink: 0,
    maxWidth: "44%",
  },
  logoWrap: {
    maxWidth: 80,
    maxHeight: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 80,
    height: 56,
  },
  headerText: { flex: 1, minWidth: 0 },
  orgName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: colors.text,
  },
  mainTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
  },
  legalSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 15,
    marginTop: 4,
  },
  metaLine: {
    textAlign: "right",
  },
  metaLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 9,
    color: colors.textSecondary,
  },
  metaValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: colors.text,
  },
  metaSpaced: { marginTop: 6 },
  badge: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  badgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: "#0F766E",
  },
  infoCard: { gap: spacing.sm },
  infoRow: { gap: 2 },
  infoLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  infoValue: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: colors.text,
  },
  infoValueHighlight: {
    fontFamily: "Poppins_600SemiBold",
    color: "#134E4A",
  },
  obligationBox: {
    padding: spacing.sm,
    backgroundColor: "#EFF6FF",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  obligationTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#1E3A8A",
    marginBottom: 4,
  },
  obligationBody: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#1E40AF",
    lineHeight: 18,
  },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: colors.text,
  },
  sectionHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  sectionTitleSmall: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    color: colors.text,
    textTransform: "uppercase",
  },
  eppCard: { gap: spacing.xs },
  eppHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.textSecondary,
  },
  signCard: { gap: spacing.sm },
  declaration: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
  },
  bold: { fontFamily: "Poppins_600SemiBold" },
  signLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    color: colors.text,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  signaturePlaceholder: {
    height: 72,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  signatureImage: {
    height: 72,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  signMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
  },
  aprBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  captureWrap: {
    marginTop: spacing.sm,
  },
  sourceFootnote: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 14,
  },
});
