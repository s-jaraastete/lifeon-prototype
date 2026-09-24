import { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Card } from "@/components/Card";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useAuth } from "@/hooks/useAuth";
import { useNetworkOnline } from "@/hooks/useNetwork";
import { consequencesForLevel, fetchMyIrl } from "@/services/irl";
import type { IrlMatrixEntry } from "@/types/models";
import { colors, spacing } from "@/theme/tokens";

export default function IrlDetailScreen() {
  const { matrixId } = useLocalSearchParams<{ matrixId: string }>();
  const { member } = useAuth();
  const online = useNetworkOnline();
  const [entry, setEntry] = useState<IrlMatrixEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!online || !matrixId) return;
    setError(null);
    try {
      const all = await fetchMyIrl();
      setEntry(all.find((e) => e.matrixId === matrixId) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar IRL");
    }
  }, [online, matrixId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const docCode = useMemo(() => {
    if (!entry) return "";
    const prefix = entry.cargoName.slice(0, 3).toUpperCase();
    return `IRL-${entry.matrixCode}-${prefix}`;
  }, [entry]);

  if (!online) {
    return <OfflineBanner />;
  }

  if (!entry) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>
          {error ?? "No se encontró la IRL solicitada para tu cargo."}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.docCode}>{docCode}</Text>
        <Text style={styles.org}>{entry.organizationName}</Text>
        <Text style={styles.meta}>Centro: {entry.workCenterName || "—"}</Text>
        <Text style={styles.meta}>Cargo: {entry.cargoName}</Text>
        <Text style={styles.meta}>
          Actualizado:{" "}
          {entry.matrixUpdatedAt
            ? new Date(entry.matrixUpdatedAt).toLocaleDateString("es-CL")
            : "—"}
        </Text>
      </Card>

      <Text style={styles.section}>Peligros, riesgos y medidas preventivas</Text>

      {entry.evaluations.map((ev, idx) => (
        <Card key={ev.id ?? idx} style={styles.riskCard}>
          <Text style={styles.task}>{ev.task}</Text>
          <Text style={styles.process}>Proceso: {ev.process}</Text>
          <Text style={styles.hazard}>⚠ {ev.hazard}</Text>
          <Text style={styles.risk}>{ev.riskEvent}</Text>
          <Text style={styles.consequence}>
            {consequencesForLevel(ev.initialLevel)}
          </Text>
          <Text style={styles.controls}>{ev.controls}</Text>
        </Card>
      ))}

      <Text style={styles.disclaimer}>
        Información generada desde matrices IPER vigentes de {member?.organizationName}.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, justifyContent: "center", padding: spacing.lg },
  empty: {
    textAlign: "center",
    color: colors.textSecondary,
    fontFamily: "Poppins_400Regular",
  },
  docCode: {
    fontFamily: "Poppins_600SemiBold",
    color: colors.secondary,
  },
  org: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: colors.text,
    marginTop: spacing.sm,
  },
  meta: {
    fontFamily: "Poppins_400Regular",
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.text,
  },
  riskCard: {
    gap: 4,
  },
  task: {
    fontFamily: "Poppins_600SemiBold",
    color: colors.text,
    fontSize: 15,
  },
  process: {
    fontFamily: "Poppins_400Regular",
    color: colors.textSecondary,
    fontSize: 12,
  },
  hazard: {
    fontFamily: "Poppins_500Medium",
    color: colors.text,
    marginTop: 4,
  },
  risk: {
    fontFamily: "Poppins_600SemiBold",
    color: colors.secondary,
    fontSize: 13,
  },
  consequence: {
    fontFamily: "Poppins_400Regular",
    color: colors.textMuted,
    fontSize: 13,
  },
  controls: {
    fontFamily: "Poppins_400Regular",
    color: colors.text,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  disclaimer: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
