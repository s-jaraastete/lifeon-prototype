import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCompactWebViewport } from "@/hooks/useCompactWebViewport";

/** Espacio extra para que la barra de tabs no quede bajo el home indicator del simulador web. */
export function useTabBarBottomInset(): number {
  const insets = useSafeAreaInsets();
  const compact = useCompactWebViewport();
  const deviceFrameExtra = Platform.OS === "web" && !compact ? 12 : 0;
  return Math.max(insets.bottom, 8) + deviceFrameExtra;
}
