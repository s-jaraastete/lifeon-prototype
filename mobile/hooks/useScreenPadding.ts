import { useDeviceLayout } from "@/context/DeviceLayoutContext";
import { spacing } from "@/theme/tokens";

export function useScreenPadding() {
  const { contentHorizontalPadding } = useDeviceLayout();
  return {
    paddingHorizontal: contentHorizontalPadding,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  };
}
