import { ScrollView, Text, StyleSheet } from "react-native";
import { Card } from "@/components/Card";
import { IrlHierarchyView } from "@/components/IrlHierarchyView";
import { useTabBarPadding } from "@/hooks/useTabBarPadding";
import type { IrlMatrixEntry, MemberContext } from "@/types/models";
import { colors, spacing } from "@/theme/tokens";

type Props = {
  entry: IrlMatrixEntry;
  member: MemberContext | null;
};

export function IrlInfoView({ entry, member }: Props) {
  const bottomPad = useTabBarPadding();

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
    >
      <Card style={styles.hero}>
        <Text style={styles.kicker}>Información de Riesgos Laborales</Text>
        <Text style={styles.heroTitle}>{entry.cargoName}</Text>
        <Text style={styles.heroMeta}>
          {member?.organizationName ?? entry.organizationName}
        </Text>
        <Text style={styles.heroMeta}>Centro: {entry.workCenterName || "—"}</Text>
        <Text style={styles.heroHint}>
          Toca cada tarea para ver peligros, riesgos y medidas. El PDF formal para firma está en
          Documentos.
        </Text>
      </Card>

      <Text style={styles.sectionTitle}>Tareas de tu cargo</Text>
      <IrlHierarchyView evaluations={entry.evaluations} />

      <Text style={styles.footnote}>
        Referencia: Matriz IPER {entry.matrixCode}
        {entry.matrixUpdatedAt
          ? ` · ${new Date(entry.matrixUpdatedAt).toLocaleDateString("es-CL")}`
          : ""}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  hero: { gap: spacing.xs },
  kicker: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: colors.secondary,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: colors.text,
  },
  heroMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: colors.textSecondary,
  },
  heroHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.text,
  },
  footnote: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
