import { useEffect, useState } from "react";
import { Platform, useWindowDimensions } from "react-native";

function detectMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Pantalla completa en teléfonos/tablets; marco de escritorio solo en viewport ancho.
 */
export function useCompactWebViewport(): boolean {
  const { width, height } = useWindowDimensions();
  const [uaMobile, setUaMobile] = useState(false);

  useEffect(() => {
    setUaMobile(detectMobileUserAgent());
  }, []);

  if (Platform.OS !== "web") return true;
  if (uaMobile) return true;
  if (width < 768) return true;
  if (height < 520) return true;
  return false;
}
