import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { DeviceLayoutProvider } from "@/context/DeviceLayoutContext";
import { WebDeviceShell } from "@/components/WebDeviceShell";
import { colors } from "@/theme/tokens";

function RootNavigator() {
  const { loading, session, member, needsOrgSelection, configError } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup =
      segments[0] === "login" ||
      segments[0] === "select-org" ||
      segments[0] === "no-cargo";

    if (configError) return;

    if (!session) {
      if (!inAuthGroup || segments[0] !== "login") {
        router.replace("/login");
      }
      return;
    }

    if (needsOrgSelection) {
      if (segments[0] !== "select-org") {
        router.replace("/select-org");
      }
      return;
    }

    if (!member) {
      if (session) return;
      router.replace("/login");
      return;
    }

    if (!member.cargoId) {
      if (segments[0] !== "no-cargo") {
        router.replace("/no-cargo");
      }
      return;
    }

    if (inAuthGroup) {
      router.replace("/(app)");
    }
  }, [loading, session, member, needsOrgSelection, configError, segments, router]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="select-org" />
      <Stack.Screen name="no-cargo" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <DeviceLayoutProvider>
        <AuthProvider>
          <WebDeviceShell>
            <RootNavigator />
          </WebDeviceShell>
        </AuthProvider>
      </DeviceLayoutProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
