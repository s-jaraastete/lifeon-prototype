"use client";

import { useRouter, useSearchParams } from "next/navigation";

const useUrlParams = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const buildParams = () => new URLSearchParams(searchParams.toString());

  const push = (params: URLSearchParams) => {
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const setParam = (key: string, value: string) => {
    const params = buildParams();
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    push(params);
  };

  const setMultiParam = (param: string, values: string[]) => {
    const params = buildParams();
    const aiKey = `ai__${param}`;
    params.delete(aiKey);
    params.delete(param);
    if (values.length === 1) {
      params.set(param, values[0]);
    } else if (values.length > 1) {
      params.set(aiKey, values.join(","));
    }
    params.delete("page");
    push(params);
  };

  return { searchParams, buildParams, push, setParam, setMultiParam };
};

export default useUrlParams;
