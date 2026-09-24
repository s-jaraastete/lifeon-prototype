import { useEffect, useState } from "react";
import { Platform, useWindowDimensions } from "react-native";

function detectMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * En web: pantalla completa en teléfonos; marco tipo dispositivo en escritorio.
 * En iOS/Android nativo siempre compacto (sin marco).
 */
export function useCompactWebViewport(): boolean {
  const { width } = useWindowDimensions();
  const [uaMobile, setUaMobile] = useState(false);

  useEffect(() => {
    setUaMobile(detectMobileUserAgent());
  }, []);

  if (Platform.OS !== "web") return true;
  if (uaMobile) return true;
  return width < 768;
}
