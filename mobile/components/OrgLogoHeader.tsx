import { View, Text, Image, StyleSheet } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { useOrgBranding } from "@/hooks/useOrgBranding";
import { useDeviceLayout } from "@/context/DeviceLayoutContext";
import { colors, radius } from "@/theme/tokens";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function OrgLogoHeader() {
  const { member } = useAuth();
  const { branding } = useOrgBranding(member?.organizationId);
  const { logoSize } = useDeviceLayout();
  const name = branding?.name ?? member?.organizationName ?? "Organización";
  const logoUrl = branding?.logoUrl;

  return (
    <View style={styles.wrap} accessibilityLabel={`Logo ${name}`}>
      <View
        style={[
          styles.logoBox,
          {
            minWidth: logoSize,
            minHeight: logoSize,
            maxWidth: logoSize + 16,
            maxHeight: logoSize + 8,
            borderRadius: Math.max(radius.md, logoSize * 0.28),
          },
        ]}
      >
        {logoUrl ? (
          <Image
            source={{ uri: logoUrl }}
            style={{ width: logoSize + 12, height: logoSize + 4, maxWidth: logoSize + 16, maxHeight: logoSize + 8 }}
            resizeMode="contain"
          />
        ) : (
          <Text style={[styles.logoInitials, { fontSize: logoSize * 0.32 }]}>
            {initialsFromName(name)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginRight: 2,
    flexShrink: 0,
  },
  logoBox: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  logoInitials: {
    fontFamily: "Poppins_700Bold",
    color: colors.secondary,
  },
});
