import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Card } from "@/components/Card";
import { buildIrlHierarchy, type IrlTaskNode } from "@/utils/irlHierarchy";
import type { IrlEvaluation } from "@/types/models";
import { colors, spacing, radius } from "@/theme/tokens";

type Props = {
  evaluations: IrlEvaluation[];
};

export function IrlHierarchyView({ evaluations }: Props) {
  const tasks = buildIrlHierarchy(evaluations);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [expandedHazards, setExpandedHazards] = useState<Record<string, boolean>>({});
  const [expandedRisks, setExpandedRisks] = useState<Record<string, boolean>>({});

  const toggle = useCallback(
    (map: Record<string, boolean>, setMap: (m: Record<string, boolean>) => void, id: string) => {
      setMap({ ...map, [id]: !map[id] });
    },
    []
  );

  if (tasks.length === 0) {
    return (
      <Card>
        <Text style={styles.empty}>No hay evaluaciones para tu cargo.</Text>
      </Card>
    );
  }

  return (
    <View style={styles.list}>
      {tasks.map((task, taskIdx) => (
        <TaskBlock
          key={task.id}
          task={task}
          index={taskIdx}
          open={Boolean(expandedTasks[task.id])}
          onToggle={() => toggle(expandedTasks, setExpandedTasks, task.id)}
          expandedHazards={expandedHazards}
          expandedRisks={expandedRisks}
          onToggleHazard={(id) => toggle(expandedHazards, setExpandedHazards, id)}
          onToggleRisk={(id) => toggle(expandedRisks, setExpandedRisks, id)}
        />
      ))}
    </View>
  );
}

function TaskBlock({
  task,
  index,
  open,
  onToggle,
  expandedHazards,
  expandedRisks,
  onToggleHazard,
  onToggleRisk,
}: {
  task: IrlTaskNode;
  index: number;
  open: boolean;
  onToggle: () => void;
  expandedHazards: Record<string, boolean>;
  expandedRisks: Record<string, boolean>;
  onToggleHazard: (id: string) => void;
  onToggleRisk: (id: string) => void;
}) {
  return (
    <Card style={styles.taskCard}>
      <Pressable onPress={onToggle} style={styles.rowPress}>
        <View style={styles.rowLeft}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{index + 1}</Text>
          </View>
          <View style={styles.rowText}>
            <Text style={styles.taskTitle}>{task.task}</Text>
            {task.process ? (
              <Text style={styles.taskProcess}>Proceso: {task.process}</Text>
            ) : null}
            <Text style={styles.rowMeta}>
              {task.hazards.length} peligro(s) identificado(s)
            </Text>
          </View>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>

      {open
        ? task.hazards.map((hazard, hIdx) => {
            const hOpen = Boolean(expandedHazards[hazard.id]);
            return (
              <View key={hazard.id} style={styles.nestedBlock}>
                <Pressable
                  onPress={() => onToggleHazard(hazard.id)}
                  style={[styles.rowPress, styles.hazardPress]}
                >
                  <View style={styles.rowLeft}>
                    <Text style={styles.hazardLabel}>Peligro {hIdx + 1}</Text>
                    <Text style={styles.hazardTitle}>{hazard.hazard}</Text>
                    <Text style={styles.rowMeta}>
                      {hazard.risks.length} riesgo(s) asociado(s)
                    </Text>
                  </View>
                  <Ionicons
                    name={hOpen ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.textSecondary}
                  />
                </Pressable>

                {hOpen
                  ? hazard.risks.map((risk, rIdx) => {
                      const rOpen = Boolean(expandedRisks[risk.id]);
                      return (
                        <View key={risk.id} style={styles.riskBlock}>
                          <Pressable
                            onPress={() => onToggleRisk(risk.id)}
                            style={styles.rowPress}
                          >
                            <View style={styles.rowLeft}>
                              <Text style={styles.riskLabel}>Riesgo {rIdx + 1}</Text>
                              <Text style={styles.riskTitle}>{risk.riskEvent}</Text>
                              {risk.initialLevel ? (
                                <Text style={styles.levelTag}>Nivel {risk.initialLevel}</Text>
                              ) : null}
                            </View>
                            <Ionicons
                              name={rOpen ? "chevron-up" : "chevron-down"}
                              size={18}
                              color={colors.textSecondary}
                            />
                          </Pressable>

                          {rOpen ? (
                            <View style={styles.controlsBox}>
                              <Text style={styles.controlsHeading}>Medidas de control</Text>
                              {risk.controls.map((measure, mIdx) => (
                                <View key={`${risk.id}-${mIdx}`} style={styles.bulletRow}>
                                  <Text style={styles.bullet}>•</Text>
                                  <Text style={styles.bulletText}>{measure}</Text>
                                </View>
                              ))}
                            </View>
                          ) : null}
                        </View>
                      );
                    })
                  : null}
              </View>
            );
          })
        : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  empty: {
    fontFamily: "Poppins_400Regular",
    color: colors.textSecondary,
    textAlign: "center",
  },
  taskCard: { padding: 0, overflow: "hidden" },
  rowPress: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    gap: spacing.sm,
  },
  rowLeft: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    color: colors.secondary,
  },
  rowText: { gap: 2 },
  taskTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  taskProcess: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.textSecondary,
  },
  rowMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  nestedBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: "#FAFAFA",
  },
  hazardPress: { paddingLeft: spacing.lg },
  hazardLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: colors.secondary,
    textTransform: "uppercase",
  },
  hazardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  riskBlock: {
    marginLeft: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
  },
  riskLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: "#B45309",
    textTransform: "uppercase",
  },
  riskTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#92400E",
    lineHeight: 20,
  },
  levelTag: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "#78716C",
    marginTop: 2,
  },
  controlsBox: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
    gap: spacing.xs,
  },
  controlsHeading: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    color: "#047857",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  bullet: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: "#047857",
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#065F46",
    lineHeight: 20,
  },
});
