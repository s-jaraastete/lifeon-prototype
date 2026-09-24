import { useCallback, useState } from "react";

import {

  View,

  Text,

  StyleSheet,

  ScrollView,

  RefreshControl,

  Pressable,

} from "react-native";

import type { ComponentProps } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useFocusEffect, useRouter } from "expo-router";

import { Card } from "@/components/Card";

import { OfflineBanner } from "@/components/OfflineBanner";

import { UserAvatar } from "@/components/UserAvatar";

import { useAuth } from "@/hooks/useAuth";

import { useUserProfile } from "@/hooks/useUserProfile";

import { useOrgBranding } from "@/hooks/useOrgBranding";

import { useDeviceLayout } from "@/context/DeviceLayoutContext";
import { useTabBarPadding } from "@/hooks/useTabBarPadding";

import { useNetworkOnline } from "@/hooks/useNetwork";

import { fetchMyIrl, irlScopeFromMember } from "@/services/irl";
import { pickPrimaryIrlEntry } from "@/utils/irlEntrySnapshot";

import { fetchMyDeliveries, isPending } from "@/services/deliveries";

import { toUserFacingError } from "@/utils/userFacingError";

import type { IrlMatrixEntry } from "@/types/models";

import { colors, radius, spacing } from "@/theme/tokens";



export default function HomeScreen() {

  const { member, session } = useAuth();

  const { profile } = useUserProfile(session?.user?.id);

  const { branding } = useOrgBranding(member?.organizationId);

  const layout = useDeviceLayout();
  const tabBarPad = useTabBarPadding();

  const online = useNetworkOnline();

  const router = useRouter();

  const [irlEntries, setIrlEntries] = useState<IrlMatrixEntry[]>([]);

  const [pendingCount, setPendingCount] = useState(0);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);



  const load = useCallback(async () => {

    if (!online || !member) return;

    setError(null);

    let loadError: string | null = null;

    const scope = irlScopeFromMember(member);

    try {

      setIrlEntries(await fetchMyIrl(scope));

    } catch (e) {

      loadError = toUserFacingError(e, "Error al cargar tu IRL");

      setIrlEntries([]);

    }

    try {

      const deliveries = await fetchMyDeliveries();

      setPendingCount(deliveries.filter((d) => isPending(d.status)).length);

    } catch (e) {

      setPendingCount(0);

      if (!loadError) {

        loadError = toUserFacingError(e, "Error al cargar documentos pendientes");

      }

    }

    setError(loadError);

  }, [online, member?.memberId, member?.organizationId]);



  useFocusEffect(

    useCallback(() => {

      load();

    }, [load])

  );



  const onRefresh = async () => {

    setRefreshing(true);

    await load();

    setRefreshing(false);

  };



  const latestUpdate = irlEntries.reduce<string | null>((acc, entry) => {

    if (!entry.matrixUpdatedAt) return acc;

    if (!acc || entry.matrixUpdatedAt > acc) return entry.matrixUpdatedAt;

    return acc;

  }, null);



  return (

    <ScrollView

      style={styles.flex}

      contentContainerStyle={[
        styles.content,
        { paddingHorizontal: layout.contentHorizontalPadding, paddingBottom: tabBarPad },
      ]}

      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}

    >

      {!online ? <OfflineBanner /> : null}



      <View style={styles.hero}>

        <UserAvatar

          name={member?.displayName ?? "Usuario"}

          imageUrl={profile?.avatarUrl}

          size={56}

        />

        <View style={styles.heroText}>

          <Text style={styles.greeting}>Hola, {member?.displayName?.split(" ")[0] ?? ""}</Text>

          <Text style={styles.subGreeting} numberOfLines={1}>

            {branding?.name ?? member?.organizationName}

          </Text>

        </View>

      </View>



      <View style={styles.statsRow}>

        <StatChip

          icon="document-text-outline"

          label="Pendientes"

          value={String(pendingCount)}

          accent={colors.primary}

        />

        <StatChip

          icon="shield-checkmark-outline"

          label="IRL"

          value={irlEntries.length > 0 ? "Sí" : "—"}

          accent={colors.secondary}

        />

      </View>



      <Card>

        <Text style={styles.cardTitle}>Tu contexto de trabajo</Text>

        <InfoLine icon="briefcase-outline" label="Cargo" value={member?.cargoName ?? "—"} />

        {member?.workCenterName ? (

          <InfoLine icon="business-outline" label="Centro" value={member.workCenterName} />

        ) : null}

      </Card>



      {error ? <Text style={styles.error}>{error}</Text> : null}



      <Pressable

        style={({ pressed }) => [styles.actionCard, styles.actionPrimary, pressed && styles.pressed]}

        onPress={() => {
          const scope = irlScopeFromMember(member);
          void fetchMyIrl(scope).then((entries) => {
            const primary = pickPrimaryIrlEntry(entries);
            if (primary) {
              router.push({
                pathname: "/(app)/irl/[matrixId]",
                params: { matrixId: primary.matrixId },
              });
            } else {
              router.push("/(app)/irl");
            }
          });
        }}

      >

        <Ionicons name="shield-checkmark" size={22} color="#fff" />

        <View style={styles.actionTextCol}>

          <Text style={styles.actionTitleLight}>Ver mi IRL</Text>

          <Text style={styles.actionSubtitleLight}>Riesgos de tu cargo</Text>

        </View>

        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.85)" />

      </Pressable>



      <Pressable

        style={({ pressed }) => [styles.actionCard, styles.actionSecondary, pressed && styles.pressed]}

        onPress={() => router.push("/(app)/documents")}

      >

        <Ionicons name="document-text" size={22} color="#fff" />

        <View style={styles.actionTextCol}>

          <Text style={styles.actionTitleLight}>Revisar documentos</Text>

          <Text style={styles.actionSubtitleLight}>Firmas y toma de conocimiento</Text>

        </View>

        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.85)" />

      </Pressable>



      {latestUpdate ? (

        <Text style={styles.meta}>

          Última actualización IRL: {new Date(latestUpdate).toLocaleDateString("es-CL")}

        </Text>

      ) : null}

    </ScrollView>

  );

}



function StatChip({

  icon,

  label,

  value,

  accent,

}: {

  icon: ComponentProps<typeof Ionicons>["name"];

  label: string;

  value: string;

  accent: string;

}) {

  return (

    <View style={styles.statChip}>

      <Ionicons name={icon} size={18} color={accent} />

      <Text style={styles.statValue}>{value}</Text>

      <Text style={styles.statLabel}>{label}</Text>

    </View>

  );

}



function InfoLine({

  icon,

  label,

  value,

}: {

  icon: ComponentProps<typeof Ionicons>["name"];

  label: string;

  value: string;

}) {

  return (

    <View style={styles.infoLine}>

      <Ionicons name={icon} size={18} color={colors.textSecondary} />

      <View>

        <Text style={styles.infoLabel}>{label}</Text>

        <Text style={styles.infoValue}>{value}</Text>

      </View>

    </View>

  );

}



const styles = StyleSheet.create({

  flex: { flex: 1, backgroundColor: colors.background },

  content: {
    paddingVertical: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },

  hero: {

    flexDirection: "row",

    alignItems: "center",

    gap: spacing.md,

    backgroundColor: colors.surface,

    borderRadius: radius.xl,

    padding: spacing.md,

    borderWidth: 1,

    borderColor: colors.border,

  },

  heroText: { flex: 1 },

  greeting: {

    fontFamily: "Poppins_700Bold",

    fontSize: 22,

    color: colors.text,

  },

  subGreeting: {

    fontFamily: "Poppins_400Regular",

    fontSize: 14,

    color: colors.textSecondary,

    marginTop: 2,

  },

  statsRow: {

    flexDirection: "row",

    gap: spacing.sm,

  },

  statChip: {

    flex: 1,

    backgroundColor: colors.surface,

    borderRadius: radius.lg,

    padding: spacing.md,

    borderWidth: 1,

    borderColor: colors.border,

    gap: 4,

  },

  statValue: {

    fontFamily: "Poppins_800ExtraBold",

    fontSize: 24,

    color: colors.text,

  },

  statLabel: {

    fontFamily: "Poppins_500Medium",

    fontSize: 12,

    color: colors.textSecondary,

  },

  cardTitle: {

    fontFamily: "Poppins_600SemiBold",

    fontSize: 15,

    color: colors.text,

    marginBottom: spacing.sm,

  },

  infoLine: {

    flexDirection: "row",

    alignItems: "center",

    gap: spacing.sm,

    paddingVertical: spacing.sm,

  },

  infoLabel: {

    fontFamily: "Poppins_500Medium",

    fontSize: 11,

    color: colors.textSecondary,

  },

  infoValue: {

    fontFamily: "Poppins_600SemiBold",

    fontSize: 15,

    color: colors.text,

  },

  actionCard: {

    flexDirection: "row",

    alignItems: "center",

    gap: spacing.md,

    padding: spacing.md,

    borderRadius: radius.xl,

  },

  actionPrimary: {

    backgroundColor: colors.primary,

  },

  actionSecondary: {

    backgroundColor: colors.secondary,

  },

  actionTextCol: { flex: 1 },

  actionTitleLight: {

    fontFamily: "Poppins_600SemiBold",

    fontSize: 16,

    color: "#fff",

  },

  actionSubtitleLight: {

    fontFamily: "Poppins_400Regular",

    fontSize: 12,

    color: "rgba(255,255,255,0.85)",

    marginTop: 2,

  },

  pressed: { opacity: 0.92 },

  meta: {

    fontFamily: "Poppins_400Regular",

    color: colors.textSecondary,

    fontSize: 13,

    textAlign: "center",

  },

  error: {

    color: colors.error,

    fontFamily: "Poppins_500Medium",

  },

});

