import { useEffect, useState, createElement } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Linking,
  Pressable,
} from "react-native";
import { getSupabase } from "@/services/supabase";
import { colors, spacing } from "@/theme/tokens";

export function ArtpSignedPdfViewer({ versionId }: { versionId: string }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const supabase = getSupabase();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Inicia sesión para ver el documento");

        const origin = process.env.EXPO_PUBLIC_WEB_ORIGIN ?? "";
        const res = await fetch(`${origin}/api/artp-versions/${versionId}/pdf`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(json.error ?? "No se pudo generar el PDF");
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        revoked = url;
        if (!cancelled) setPdfUrl(url);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error al cargar PDF");
          setPdfUrl(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [versionId]);

  if (loading) {
    return (
      <View style={styles.box}>
        <ActivityIndicator color={colors.secondary} />
        <Text style={styles.hint}>Generando PDF firmado…</Text>
      </View>
    );
  }

  if (error || !pdfUrl) {
    return (
      <View style={styles.box}>
        <Text style={styles.error}>{error ?? "PDF no disponible"}</Text>
      </View>
    );
  }

  if (Platform.OS === "web") {
    return (
      <View style={styles.webWrap}>
        <Pressable onPress={() => Linking.openURL(pdfUrl)}>
          <Text style={styles.link}>Abrir PDF</Text>
        </Pressable>
        {createElement("iframe", {
          src: pdfUrl,
          title: "ARTP PDF",
          style: { width: "100%", minHeight: 640, border: "none", borderRadius: 8 },
        })}
      </View>
    );
  }

  return (
    <Pressable onPress={() => Linking.openURL(pdfUrl)}>
      <Text style={styles.link}>Abrir PDF firmado</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { padding: spacing.lg, alignItems: "center" },
  hint: { marginTop: 8, fontFamily: "Poppins_400Regular", color: colors.textSecondary },
  error: { fontFamily: "Poppins_500Medium", color: colors.error, textAlign: "center" },
  webWrap: { width: "100%", gap: spacing.sm },
  link: { fontFamily: "Poppins_600SemiBold", color: colors.secondary, marginBottom: 8 },
});
