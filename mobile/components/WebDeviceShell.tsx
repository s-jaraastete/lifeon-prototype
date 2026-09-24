import { ReactNode, useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useCompactWebViewport } from "@/hooks/useCompactWebViewport";
import { useWindowDimensions } from "react-native";
import {
  BASE_PHONE_HEIGHT,
  BASE_PHONE_WIDTH,
  useDeviceLayout,
} from "@/context/DeviceLayoutContext";
import { colors } from "@/theme/tokens";

const BEZEL = 10;

export function WebDeviceShell({ children }: { children: ReactNode }) {
  const compact = useCompactWebViewport();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const layout = useDeviceLayout();

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

  const scale = layout.viewportWidth / BASE_PHONE_WIDTH;
  const islandW = Math.round(120 * scale);
  const islandH = Math.round(34 * scale);
  const outerW = layout.viewportWidth + BEZEL * 2;
  const outerH = layout.viewportHeight + BEZEL * 2;
  const homeW = Math.round(134 * scale);

  return (
    <View style={[styles.desktopRoot, { padding: Math.min(24, windowWidth * 0.04) }]}>
      <View style={[styles.phoneOuter, { width: outerW, height: outerH }]}>
        <View
          style={[
            styles.dynamicIsland,
            {
              width: islandW,
              height: islandH,
              borderRadius: islandH / 2,
              top: BEZEL + Math.round(8 * scale),
            },
          ]}
        />
        <View style={styles.phoneScreen}>{children}</View>
        <View
          style={[
            styles.homeIndicator,
            {
              width: homeW,
              bottom: BEZEL + 4,
            },
          ]}
        />
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
  },
  phoneOuter: {
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
    alignSelf: "center",
    backgroundColor: "#000",
    zIndex: 10,
    pointerEvents: "none",
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 36,
    overflow: "hidden",
    backgroundColor: colors.background,
  },
  homeIndicator: {
    position: "absolute",
    alignSelf: "center",
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
    zIndex: 10,
    pointerEvents: "none",
  },
});
