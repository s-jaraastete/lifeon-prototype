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

type Props = {
  deliveryId: string;
  minHeight?: number;
};

export function IrlDeliveryPdfViewer({ deliveryId, minHeight = 520 }: Props) {
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
        if (!session?.access_token) {
          throw new Error("Inicia sesión para ver el documento");
        }

        const res = await fetch(`/api/document-deliveries/${deliveryId}/pdf`, {
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
  }, [deliveryId]);

  if (loading) {
    return (
      <View style={[styles.box, { minHeight }]}>
        <ActivityIndicator color={colors.secondary} />
        <Text style={styles.hint}>Generando PDF…</Text>
      </View>
    );
  }

  if (error || !pdfUrl) {
    return (
      <View style={[styles.box, { minHeight: 120 }]}>
        <Text style={styles.error}>{error ?? "PDF no disponible"}</Text>
      </View>
    );
  }

  if (Platform.OS === "web") {
    return (
      <View style={styles.webWrap}>
        <Pressable onPress={() => Linking.openURL(pdfUrl)} style={styles.openLink}>
          <Text style={styles.openLinkText}>Abrir PDF en pestaña nueva</Text>
        </Pressable>
        {/* Visor nativo del navegador (como abrir un PDF) */}
        {createElement("iframe", {
          src: `${pdfUrl}#toolbar=1&navpanes=0`,
          title: "Documento IRL PDF",
          style: {
            width: "100%",
            minHeight,
            height: minHeight,
            border: "none",
            borderRadius: 8,
            backgroundColor: "#525659",
          },
        })}
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <Pressable onPress={() => Linking.openURL(pdfUrl)}>
        <Text style={styles.openLinkText}>Abrir documento PDF</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
  },
  webWrap: { width: "100%", gap: spacing.sm },
  hint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: colors.textSecondary,
  },
  error: {
    fontFamily: "Poppins_500Medium",
    color: colors.error,
    textAlign: "center",
  },
  openLink: { alignSelf: "flex-end" },
  openLinkText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: colors.secondary,
  },
});
