import { View, Text, StyleSheet, Pressable } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/Card";
import { LifeOnWordmark } from "@/components/LifeOnWordmark";
import { colors, spacing } from "@/theme/tokens";

export default function SelectOrgScreen() {
  const { memberships, selectMember } = useAuth();

  return (
    <View style={styles.container}>
      <LifeOnWordmark size="md" />
      <Text style={styles.title}>Elige tu organización</Text>
      {memberships.map((m) => (
        <Pressable key={m.memberId} onPress={() => selectMember(m.memberId)}>
          <Card style={styles.card}>
            <Text style={styles.orgName}>{m.organizationName}</Text>
            <Text style={styles.meta}>{m.email}</Text>
            <Text style={styles.meta}>Rol: {m.role}</Text>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: colors.text,
  },
  card: {
    marginTop: spacing.sm,
  },
  orgName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: colors.text,
  },
  meta: {
    fontFamily: "Poppins_400Regular",
    color: colors.textSecondary,
    marginTop: 4,
  },
});
