"use client";

import { useState } from "react";
import useDebounce from "@/hooks/useDebounce";

const useDebouncedUrlParam = (
  key: string,
  urlValue: string,
  setParam: (key: string, value: string) => void,
  delay = 500
) => {
  const [value, setValue] = useState(urlValue);
  const [prevUrlValue, setPrevUrlValue] = useState(urlValue);

  if (urlValue !== prevUrlValue) {
    setPrevUrlValue(urlValue);
    setValue(urlValue);
  }

  useDebounce(
    () => {
      if (value !== urlValue) setParam(key, value);
    },
    delay,
    [value]
  );

  return [value, setValue] as const;
};

export default useDebouncedUrlParam;
