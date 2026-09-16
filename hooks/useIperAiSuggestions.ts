"use client";

import { useCallback, useState } from "react";
import type { IperAiContextInput, IperSuggestionKind } from "@/types/ai";
import { postAprVirtualSuggestions } from "@/lib/ai/aprVirtualClient";

export function useIperAiSuggestions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(
    async <T,>(kind: IperSuggestionKind, iperContext: IperAiContextInput) => {
      setLoading(true);
      setError(null);
      try {
        const res = await postAprVirtualSuggestions(kind, iperContext);
        return res.suggestions as T[];
      } catch (e) {
        const msg = e instanceof Error ? e.message : "No se pudieron obtener sugerencias.";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { fetchSuggestions, loading, error, setError };
}

export default useIperAiSuggestions;
