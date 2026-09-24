import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { colors, radius, shadow } from "@/theme/tokens";

interface UserAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
  editable?: boolean;
  loading?: boolean;
  onPress?: () => void;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function UserAvatar({
  name,
  imageUrl,
  size = 72,
  editable,
  loading,
  onPress,
}: UserAvatarProps) {
  const content = (
    <View
      style={[
        styles.circle,
        shadow.soft,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.32 }]}>
          {initialsFromName(name)}
        </Text>
      )}
      {editable ? (
        <View style={styles.editBadge}>
          <Text style={styles.editBadgeText}>✎</Text>
        </View>
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initials: {
    fontFamily: "Poppins_700Bold",
    color: colors.secondary,
  },
  editBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  editBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
});
