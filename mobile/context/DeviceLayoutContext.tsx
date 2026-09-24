import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCompactWebViewport } from "@/hooks/useCompactWebViewport";

export type DeviceLayoutMode = "native" | "mobile-web" | "desktop-frame";

export interface DeviceLayoutMetrics {
  mode: DeviceLayoutMode;
  viewportWidth: number;
  viewportHeight: number;
  headerTopInset: number;
  tabBarBottomInset: number;
  logoSize: number;
  tabLabelFontSize: number;
  tabIconSize: number;
  headerTitleFontSize: number;
  contentHorizontalPadding: number;
}

const BASE_PHONE_WIDTH = 390;
const BASE_PHONE_HEIGHT = 844;

const defaultMetrics: DeviceLayoutMetrics = {
  mode: "native",
  viewportWidth: 390,
  viewportHeight: 844,
  headerTopInset: 0,
  tabBarBottomInset: 0,
  logoSize: 36,
  tabLabelFontSize: 10,
  tabIconSize: 22,
  headerTitleFontSize: 17,
  contentHorizontalPadding: 16,
};

const DeviceLayoutContext = createContext<DeviceLayoutMetrics>(defaultMetrics);

function computeDesktopFrameMetrics(
  windowWidth: number,
  windowHeight: number
): Pick<
  DeviceLayoutMetrics,
  "viewportWidth" | "viewportHeight" | "headerTopInset" | "tabBarBottomInset"
> {
  const padding = 24;
  const maxW = Math.max(280, windowWidth - padding * 2);
  const maxH = Math.max(480, windowHeight - padding * 2);

  let viewportWidth = Math.min(BASE_PHONE_WIDTH, maxW);
  let viewportHeight = (viewportWidth / BASE_PHONE_WIDTH) * BASE_PHONE_HEIGHT;

  if (viewportHeight > maxH) {
    viewportHeight = maxH;
    viewportWidth = (viewportHeight / BASE_PHONE_HEIGHT) * BASE_PHONE_WIDTH;
  }

  const scale = viewportWidth / BASE_PHONE_WIDTH;
  const headerTopInset = Math.round(12 + 34 * scale);
  const tabBarBottomInset = Math.round(12 + 28 * scale + 20);

  return {
    viewportWidth,
    viewportHeight,
    headerTopInset,
    tabBarBottomInset,
  };
}

function typographyForWidth(width: number): Pick<
  DeviceLayoutMetrics,
  "logoSize" | "tabLabelFontSize" | "tabIconSize" | "headerTitleFontSize" | "contentHorizontalPadding"
> {
  if (width < 340) {
    return {
      logoSize: 32,
      tabLabelFontSize: 9,
      tabIconSize: 20,
      headerTitleFontSize: 15,
      contentHorizontalPadding: 12,
    };
  }
  if (width < 380) {
    return {
      logoSize: 36,
      tabLabelFontSize: 9,
      tabIconSize: 21,
      headerTitleFontSize: 16,
      contentHorizontalPadding: 14,
    };
  }
  return {
    logoSize: 40,
    tabLabelFontSize: 10,
    tabIconSize: 22,
    headerTitleFontSize: 17,
    contentHorizontalPadding: 16,
  };
}

export function DeviceLayoutProvider({ children }: { children: ReactNode }) {
  const compact = useCompactWebViewport();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const metrics = useMemo((): DeviceLayoutMetrics => {
    const typography = typographyForWidth(windowWidth);

    if (Platform.OS !== "web" || compact) {
      return {
        mode: Platform.OS === "web" ? "mobile-web" : "native",
        viewportWidth: windowWidth,
        viewportHeight: windowHeight,
        headerTopInset: Math.max(insets.top, Platform.OS === "web" ? 8 : 0),
        tabBarBottomInset: Math.max(insets.bottom, Platform.OS === "web" ? 20 : 12),
        ...typography,
      };
    }

    const frame = computeDesktopFrameMetrics(windowWidth, windowHeight);
    const frameTypography = typographyForWidth(frame.viewportWidth);

    return {
      mode: "desktop-frame",
      ...frame,
      ...frameTypography,
    };
  }, [compact, windowWidth, windowHeight, insets.top, insets.bottom]);

  return (
    <DeviceLayoutContext.Provider value={metrics}>{children}</DeviceLayoutContext.Provider>
  );
}

export function useDeviceLayout(): DeviceLayoutMetrics {
  return useContext(DeviceLayoutContext);
}

export { BASE_PHONE_WIDTH, BASE_PHONE_HEIGHT };
