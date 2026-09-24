import { useDeviceLayout } from "@/context/DeviceLayoutContext";

export function useTabBarBottomInset(): number {
  return useDeviceLayout().tabBarBottomInset;
}

export function useHeaderTopInset(): number {
  return useDeviceLayout().headerTopInset;
}
