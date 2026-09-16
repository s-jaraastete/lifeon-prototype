"use client";

import { useAprVirtualChat } from "@/hooks/useAprVirtualChat";
import type { DashboardMenuKey } from "@/types/dashboardNav";
import type { AiUiContext } from "@/types/ai";

export function useAprVirtualAssistant(activeModule: DashboardMenuKey, extra?: Partial<AiUiContext>) {
  const uiContext: AiUiContext = {
    module: activeModule,
    ...extra,
  };
  return useAprVirtualChat("module_assistant", uiContext);
}

export default useAprVirtualAssistant;
