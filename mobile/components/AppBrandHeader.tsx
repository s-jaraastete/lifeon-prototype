import { View, Text, Image, StyleSheet } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { useOrgBranding } from "@/hooks/useOrgBranding";
import { colors, radius, spacing } from "@/theme/tokens";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function AppBrandHeader() {
  const { member } = useAuth();
  const { branding } = useOrgBranding(member?.organizationId);
  const name = branding?.name ?? member?.organizationName ?? "Organización";
  const logoUrl = branding?.logoUrl;

  return (
    <View style={styles.wrap}>
      <View style={styles.logoBox}>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="contain" />
        ) : (
          <Text style={styles.logoInitials}>{initialsFromName(name)}</Text>
        )}
      </View>
      <View style={styles.textCol}>
        <Text style={styles.orgName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.tagline} numberOfLines={1}>
          LifeOn Mobile
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    maxWidth: 260,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  logoInitials: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    color: colors.secondary,
  },
  textCol: {
    flexShrink: 1,
  },
  orgName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: colors.text,
  },
  tagline: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: colors.textSecondary,
  },
});
