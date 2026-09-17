"use client";

import { useEffect, useState } from "react";

export function useSuggestions(key: string) {
  const [values, setValues] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    fetch(`/api/suggestions?key=${key}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) setValues(data.values ?? []);
      })
      .catch(() => {
        // 자동완성 실패는 조용히 무시 (입력 자체는 계속 가능해야 함)
      });
    return () => {
      active = false;
    };
  }, [key]);

  return values;
}
