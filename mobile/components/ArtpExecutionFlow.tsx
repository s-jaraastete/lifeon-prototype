import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNetworkOnline } from "@/hooks/useNetwork";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SignaturePad } from "@/components/SignaturePad";
import { getSupabase } from "@/services/supabase";
import { registerArtpAckMobile } from "@/services/artp";
import { colors } from "@/theme/tokens";

interface ArtpExecutionFlowProps {
  executionId: string;
}

export function ArtpExecutionFlow({ executionId }: ArtpExecutionFlowProps) {
  const { member } = useAuth();
  const online = useNetworkOnline();
  const [taskName, setTaskName] = useState("");
  const [fit, setFit] = useState<boolean | null>(null);
  const [alert, setAlert] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!online) return;
    const client = getSupabase();
    void client
      .from("artp_executions")
      .select("artp_version_id")
      .eq("id", executionId)
      .maybeSingle()
      .then(async ({ data }: { data: { artp_version_id?: string } | null }) => {
        if (!data?.artp_version_id) return;
        const { data: detail } = await client.rpc("get_artp_version_detail", {
          p_version_id: data.artp_version_id,
        });
        const ver = (detail as { version?: { taskName?: string } })?.version;
        setTaskName(ver?.taskName ?? "");
      });
  }, [executionId, online]);

  if (!online) {
    return <OfflineBanner />;
  }

  const handleSignature = async (base64: string) => {
    if (!member) return;
    const client = getSupabase();
    const { data: ackId } = await client.rpc("ensure_artp_acknowledgement", {
      p_execution_id: executionId,
      p_member_id: member.memberId,
    });
    if (!ackId) {
      setMessage("No se pudo preparar la firma.");
      return;
    }
    const path = `${member.organizationId}/${member.authUserId}/artp_${ackId}.png`;
    const blob = await (await fetch(base64)).blob();
    await client.storage.from("acknowledgement-evidence").upload(path, blob, {
      contentType: "image/png",
      upsert: true,
    });
    const res = await registerArtpAckMobile(String(ackId), path);
    setMessage(res.ok ? "Toma de conocimiento registrada." : res.message);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Ejecución ARTP</Text>
      {taskName ? <Text style={styles.task}>{taskName}</Text> : null}

      <View style={styles.block}>
        <Text style={styles.question}>
          ¿Te encuentras en condiciones físicas y psicológicas adecuadas para realizar esta tarea?
        </Text>
        <RowYesNo value={fit} onChange={setFit} />
      </View>

      <View style={styles.block}>
        <Text style={styles.question}>
          ¿Te encuentras alerta y en condiciones de concentrarte en la tarea?
        </Text>
        <RowYesNo value={alert} onChange={setAlert} />
      </View>

      {(fit === false || alert === false) && (
        <Text style={styles.warn}>
          Informa al supervisor y no continúes hasta resolver la condición según el procedimiento interno.
        </Text>
      )}

      <SignaturePad onConfirm={handleSignature} />

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </ScrollView>
  );
}

function RowYesNo({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.btn, value === true && styles.btnActive]}
        onPress={() => onChange(true)}
      >
        <Text style={styles.btnText}>Sí</Text>
      </Pressable>
      <Pressable
        style={[styles.btn, value === false && styles.btnDanger]}
        onPress={() => onChange(false)}
      >
        <Text style={styles.btnText}>No</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 20, color: colors.text },
  task: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: colors.secondary, marginVertical: 8 },
  block: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  question: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: colors.text },
  row: { flexDirection: "row", gap: 12, marginTop: 12 },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  btnActive: { backgroundColor: "#ccfbf1", borderColor: colors.secondary },
  btnDanger: { backgroundColor: "#fee2e2", borderColor: "#f87171" },
  btnText: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  warn: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#92400e",
  },
  message: {
    marginTop: 16,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
    color: colors.textSecondary,
  },
});
