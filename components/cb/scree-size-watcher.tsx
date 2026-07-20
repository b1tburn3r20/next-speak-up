"use client";

import { useAppStore } from "@/app/stores/useAppStore";
import { useEffect } from "react";

const ScreenSizeWatcher = () => {
  const setIsMobile = useAppStore((f) => f.setIsMobile);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      checkIfMobile();
      window.addEventListener("resize", checkIfMobile);
      return () => window.removeEventListener("resize", checkIfMobile);
    }
  }, []);

  return null;
};

export default ScreenSizeWatcher;
