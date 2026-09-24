import { useDeviceLayout } from "@/context/DeviceLayoutContext";

const TAB_BAR_CORE = 56;

/** Espacio inferior para que el contenido no quede bajo la barra de tabs. */
export function useTabBarPadding(): number {
  const layout = useDeviceLayout();
  const frameExtra = layout.mode === "desktop-frame" ? 32 : 12;
  return TAB_BAR_CORE + layout.tabBarBottomInset + frameExtra;
}
