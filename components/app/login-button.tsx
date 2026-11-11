"use client";

import { useLoginStore } from "@/app/navbar/use-login-store";
import { Button } from "@/components/ui/button";

/** Opens the one login dialog, from anywhere a page needs someone signed in. */
export function LoginButton({ children = "Log in or sign up", size = "lg" }: { children?: React.ReactNode; size?: "sm" | "default" | "lg" }) {
  const open = useLoginStore((store) => store.setIsLoginDialogOpen);
  return (
    <Button size={size} onClick={() => open(true)} data-testid="login-button">
      {children}
    </Button>
  );
}
