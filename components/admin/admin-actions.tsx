"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** A small button that calls an admin route, then shows the new state. */
export function AdminActionButton({
  url,
  method,
  body,
  label,
  done,
  ariaLabel,
  testId,
}: {
  url: string;
  method: "POST" | "PATCH" | "DELETE";
  body: unknown;
  label: string;
  done?: string;
  ariaLabel?: string;
  testId?: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const run = async () => {
    setSaving(true);
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "That didn't work.");
      if (done) toast.success(done);
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Button variant="secondary" size="sm" disabled={saving} onClick={run} aria-label={ariaLabel} data-testid={testId}>
      {label}
    </Button>
  );
}
