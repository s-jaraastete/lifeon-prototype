import { ReactNode, useEffect } from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";
import { useCompactWebViewport } from "@/hooks/useCompactWebViewport";
import { useWindowDimensions } from "react-native";
import { colors } from "@/theme/tokens";

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;
const BEZEL = 10;

export function WebDeviceShell({ children }: { children: ReactNode }) {
  const compact = useCompactWebViewport();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const phoneScale = compact
    ? 1
    : Math.min(1, (windowHeight - 48) / (PHONE_HEIGHT + BEZEL * 2), (windowWidth - 48) / (PHONE_WIDTH + BEZEL * 2));

  useEffect(() => {
    if (Platform.OS !== "web" || compact || typeof document === "undefined") return;
    const prevHtml = document.documentElement.style.cssText;
    const prevBody = document.body.style.cssText;
    document.documentElement.style.height = "100%";
    document.documentElement.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.body.style.height = "100%";
    document.body.style.overflow = "hidden";
    document.body.style.backgroundColor = "#1a1a1e";
    return () => {
      document.documentElement.style.cssText = prevHtml;
      document.body.style.cssText = prevBody;
    };
  }, [compact]);

  if (Platform.OS !== "web" || compact) {
    return <View style={styles.fullscreen}>{children}</View>;
  }

  return (
    <View style={styles.desktopRoot}>
      <View
        style={[
          styles.phoneOuter,
          {
            transform: [{ scale: phoneScale }],
          },
        ]}
      >
        <View style={styles.dynamicIsland} />
        <View style={styles.phoneScreen}>{children}</View>
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  desktopRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a1e",
    padding: 24,
  } as ViewStyle,
  phoneOuter: {
    width: PHONE_WIDTH + BEZEL * 2,
    height: PHONE_HEIGHT + BEZEL * 2,
    borderRadius: 44,
    padding: BEZEL,
    backgroundColor: "#0d0d0f",
    borderWidth: 1,
    borderColor: "#2c2c30",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.45,
    shadowRadius: 48,
    elevation: 24,
    overflow: "hidden",
  },
  dynamicIsland: {
    position: "absolute",
    top: BEZEL + 10,
    alignSelf: "center",
    width: 120,
    height: 34,
    borderRadius: 20,
    backgroundColor: "#000",
    zIndex: 10,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 36,
    overflow: "hidden",
    backgroundColor: colors.background,
    marginBottom: 16,
  },
  homeIndicator: {
    position: "absolute",
    bottom: BEZEL + 10,
    alignSelf: "center",
    width: 134,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
    zIndex: 10,
  },
});
