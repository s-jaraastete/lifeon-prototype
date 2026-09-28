import { Text, View, StyleSheet } from "react-native";
import { Card } from "@/components/Card";
import { normalizeDeliverySnapshot } from "@/utils/deliverySnapshot";
import { colors, spacing } from "@/theme/tokens";

type Props = {
  snapshot: Record<string, unknown>;
};

export function ArtpDeliverySnapshotView({ snapshot }: Props) {
  const snap = normalizeDeliverySnapshot(snapshot);
  const planning = (snap.planning ?? {}) as Record<string, unknown>;
  const wc = (planning.workContext ?? {}) as Record<string, unknown>;
  const taskName =
    (typeof planning.taskName === "string" && planning.taskName) ||
    (typeof snap.taskName === "string" && snap.taskName) ||
    "ARTP planificado";
  const steps = Array.isArray(snap.steps) ? snap.steps : [];
  const workers = Array.isArray(planning.workers) ? planning.workers : [];

  return (
    <Card style={styles.card}>
      <Text style={styles.heading}>{taskName}</Text>
      {typeof wc.workDate === "string" && wc.workDate ? (
        <Text style={styles.meta}>Fecha de trabajo: {wc.workDate}</Text>
      ) : null}
      {typeof wc.specificLocation === "string" && wc.specificLocation ? (
        <Text style={styles.meta}>Lugar: {wc.specificLocation}</Text>
      ) : null}
      {typeof wc.supervisorName === "string" && wc.supervisorName ? (
        <Text style={styles.meta}>Supervisor: {wc.supervisorName}</Text>
      ) : null}
      <Text style={styles.meta}>Pasos planificados: {steps.length}</Text>
      {workers.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.subheading}>Participantes</Text>
          {workers.map((w, idx) => {
            const row = w as Record<string, unknown>;
            const name =
              typeof row.workerName === "string" ? row.workerName : `Trabajador ${idx + 1}`;
            return (
              <Text key={String(row.id ?? idx)} style={styles.bullet}>
                • {name}
              </Text>
            );
          })}
        </View>
      ) : null}
      <Text style={styles.note}>
        Revise el contenido completo del ARTP en la plataforma web si necesita el detalle de pasos,
        controles y gestión de cambios antes de firmar.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  heading: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subheading: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: colors.text,
    marginBottom: 4,
  },
  meta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  block: { marginTop: spacing.sm },
  bullet: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: colors.textSecondary,
  },
  note: {
    marginTop: spacing.md,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
