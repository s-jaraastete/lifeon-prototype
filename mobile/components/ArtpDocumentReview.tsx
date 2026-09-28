import { useState, type ReactNode } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { Card } from "@/components/Card";
import { colors, spacing } from "@/theme/tokens";

type Props = {
  snapshot: Record<string, unknown>;
};

function siNo(value: unknown): string {
  if (value === true) return "Sí";
  if (value === false) return "No";
  return "—";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asList(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === "object") as Record<string, unknown>[];
}

const CATEGORY_LABEL: Record<string, string> = {
  personas: "1. Personas",
  entorno: "2. Entorno",
  herramientas: "3. Herramientas y/o equipos",
};

export function ArtpDocumentReview({ snapshot }: Props) {
  const planning = asRecord(snapshot.planning);
  const work = asRecord(planning.workContext);
  const taskName =
    (typeof planning.taskName === "string" && planning.taskName) ||
    (typeof snapshot.taskName === "string" && snapshot.taskName) ||
    "ARTP";
  const changes = asList(planning.changeAnswers);
  const steps = asList(snapshot.steps);
  const workers = asList(planning.workers);

  return (
    <View>
      <Section title="I. Antecedentes" defaultOpen>
        <Line label="Tarea" value={taskName} />
        <Line label="Fecha" value={text(work.workDate)} />
        <Line label="Horario" value={[text(work.startTime), text(work.endTime)].filter((v) => v !== "—").join(" – ") || "—"} />
        <Line label="Lugar" value={text(work.specificLocation)} />
        <Line label="Área" value={text(work.workArea)} />
        <Line label="Supervisor" value={text(work.supervisorName)} />
      </Section>

      <Section title="II. Gestión de cambios">
        {(["personas", "entorno", "herramientas"] as const).map((category) => {
          const rows = changes.filter((row) => row.category === category);
          if (rows.length === 0) return null;
          return (
            <View key={category} style={styles.block}>
              <Text style={styles.sub}>{CATEGORY_LABEL[category]}</Text>
              {rows.map((row) => (
                <View key={String(row.questionId)} style={styles.qa}>
                  <Text style={styles.question}>{text(row.question)}</Text>
                  <Text style={styles.answer}>Respuesta: {siNo(row.answer)}</Text>
                  {row.answer === false ? (
                    <Text style={styles.detail}>
                      Cambio: {text(row.changeDescription)}
                      {"\n"}Evento: {text(row.undesiredEvent)}
                      {"\n"}Control: {text(row.additionalControl)}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          );
        })}
        {changes.length === 0 ? <Text style={styles.muted}>Sin respuestas de gestión de cambios.</Text> : null}
      </Section>

      <Section title="III. Paso a paso">
        {steps.length === 0 ? <Text style={styles.muted}>Sin pasos.</Text> : null}
        {steps.map((step, index) => {
          const events = asList(step.events);
          const hazards = asList(step.hazards);
          const controls = events.length
            ? events.flatMap((event) =>
                asList(event.controls).map((control) => ({
                  event: text(event.name),
                  control: text(control.description),
                }))
              )
            : hazards.flatMap((hazard) =>
                asList(hazard.risks).flatMap((risk) =>
                  asList(risk.controls).map((control) => ({
                    event: text(risk.name || hazard.name),
                    control: text(control.description),
                  }))
                )
              );
          return (
            <View key={String(step.id ?? index)} style={styles.qa}>
              <Text style={styles.question}>
                {String(step.sequence ?? index + 1)}. {text(step.description)}
              </Text>
              {controls.slice(0, 6).map((item, i) => (
                <Text key={i} style={styles.detail}>
                  {item.event}: {item.control}
                </Text>
              ))}
            </View>
          );
        })}
      </Section>

      <Section title="IV. Participantes">
        {workers.length === 0 ? <Text style={styles.muted}>Sin participantes.</Text> : null}
        {workers.map((worker, index) => (
          <Text key={String(worker.id ?? index)} style={styles.answer}>
            • {text(worker.workerName)}
          </Text>
        ))}
      </Section>
    </View>
  );
}

function text(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  return "—";
}

function Section(props: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(props.defaultOpen ?? false);
  return (
    <Card style={styles.card}>
      <Pressable onPress={() => setOpen((value) => !value)}>
        <Text style={styles.title}>
          {open ? "▾" : "▸"} {props.title}
        </Text>
      </Pressable>
      {open ? <View style={styles.body}>{props.children}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: colors.text,
  },
  body: { marginTop: spacing.sm },
  sub: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: colors.secondary,
    marginBottom: 6,
    marginTop: 8,
  },
  block: { marginBottom: 4 },
  qa: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
  },
  question: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: colors.text,
  },
  answer: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detail: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  muted: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.textSecondary,
  },
  line: { marginBottom: 4 },
});

function Line(props: { label: string; value: string }) {
  return (
    <Text style={styles.answer}>
      <Text style={styles.question}>{props.label}: </Text>
      {props.value}
    </Text>
  );
}
