"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OptionSelect, type SelectOption } from "@/components/ui/option-select";

/** Changes someone's role. The server decides if it's allowed, and says why if not. */
export function RoleSelect({
  userId,
  roleId,
  options,
  disabled,
  label,
}: {
  userId: string;
  roleId: number | null;
  options: SelectOption[];
  disabled?: boolean;
  label: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(roleId ? String(roleId) : "");
  const [saving, setSaving] = useState(false);

  const change = async (next: string) => {
    const previous = value;
    setValue(next);
    setSaving(true);
    try {
      const response = await fetch("/api/admin/roles/assign-role-to-user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, roleId: Number(next) }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "That didn't work.");
      toast.success("Role changed");
      router.refresh();
    } catch (error) {
      setValue(previous);
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <OptionSelect
      aria-label={label}
      value={value}
      onValueChange={change}
      options={options}
      disabled={disabled || saving}
      placeholder="No role"
      data-testid="role-select"
    />
  );
}
