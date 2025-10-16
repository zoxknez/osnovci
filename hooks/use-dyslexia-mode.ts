// Dyslexia Mode Hook - For children with dyslexia (10-15%)
"use client";

import { useEffect, useState } from "react";

export function useDyslexiaMode() {
  const [enabled, setEnabled] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dyslexia-mode");
    if (saved === "true") {
      setEnabled(true);
      document.body.classList.add("dyslexia-mode");
    }
  }, []);

  const toggle = (value: boolean) => {
    setEnabled(value);
    localStorage.setItem("dyslexia-mode", String(value));

    if (value) {
      document.body.classList.add("dyslexia-mode");
    } else {
      document.body.classList.remove("dyslexia-mode");
    }
  };

  return {
    enabled,
    toggle,
  };
}
