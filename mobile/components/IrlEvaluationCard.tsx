import { View, Text, StyleSheet } from "react-native";
import { Card } from "@/components/Card";
import { consequencesForLevel } from "@/services/irl";
import type { IrlEvaluation } from "@/types/models";
import { colors, spacing, radius } from "@/theme/tokens";

function riskLevelColor(level?: string): string {
  switch (level) {
    case "Crítico":
      return colors.error;
    case "Alto":
      return "#D97706";
    case "Medio":
      return "#CA8A04";
    default:
      return colors.secondary;
  }
}

type Props = {
  evaluation: IrlEvaluation;
  index: number;
};

export function IrlEvaluationCard({ evaluation, index }: Props) {
  const level = evaluation.initialLevel || "Medio";
  const levelColor = riskLevelColor(level);

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.index}>Tarea {index + 1}</Text>
        <View style={[styles.levelBadge, { backgroundColor: `${levelColor}18` }]}>
          <Text style={[styles.levelText, { color: levelColor }]}>Nivel {level}</Text>
        </View>
      </View>

      <View style={styles.blockTask}>
        <Text style={styles.blockTitle}>Tarea / actividad</Text>
        <Text style={styles.taskBody}>{evaluation.task || "—"}</Text>
        {evaluation.process ? (
          <Text style={styles.processLabel}>
            Proceso: <Text style={styles.processValue}>{evaluation.process}</Text>
          </Text>
        ) : null}
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Peligro identificado</Text>
        <Text style={styles.blockBody}>{evaluation.hazard || "—"}</Text>
      </View>

      <View style={styles.blockRisk}>
        <Text style={styles.blockTitleRisk}>Riesgo asociado al peligro</Text>
        <Text style={styles.riskBody}>{evaluation.riskEvent || "—"}</Text>
        <Text style={styles.consequences}>
          Consecuencias posibles: {consequencesForLevel(evaluation.initialLevel)}
        </Text>
      </View>

      <View style={styles.controlsBlock}>
        <Text style={styles.controlsTitle}>Medidas de control</Text>
        <Text style={styles.controlsBody}>{evaluation.controls || "—"}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  index: {
    fontFamily: "Poppins_600SemiBold",
    color: colors.textSecondary,
    fontSize: 12,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  levelText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },
  blockTask: {
    padding: spacing.sm,
    backgroundColor: "#F0FDFA",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  taskBody: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  processLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  processValue: {
    fontFamily: "Poppins_500Medium",
    color: colors.text,
  },
  block: {
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  blockRisk: {
    padding: spacing.sm,
    backgroundColor: "#FFFBEB",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  blockTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  blockTitleRisk: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#B45309",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  blockBody: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.text,
    lineHeight: 21,
  },
  riskBody: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#92400E",
    lineHeight: 21,
  },
  consequences: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#78716C",
    marginTop: 6,
    lineHeight: 18,
  },
  controlsBlock: {
    padding: spacing.sm,
    backgroundColor: "#ECFDF5",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  controlsTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#047857",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  controlsBody: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#065F46",
    lineHeight: 21,
  },
});
