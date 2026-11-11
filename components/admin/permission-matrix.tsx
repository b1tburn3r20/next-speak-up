"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Role = { id: number; name: string; description: string | null; users: number; permissionIds: number[] };
type Permission = { id: number; name: string; description: string | null };

async function send(url: string, method: string, body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // The box has already changed, so leaving or reloading mustn't cancel the save.
    keepalive: true,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? "That didn't work.");
  return data;
}

function CreateDialog({
  kind,
  onClose,
  onCreated,
}: {
  kind: "role" | "permission";
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (kind === "role") await send("/api/admin/roles/create-role", "POST", { roleName: name.trim(), description: description.trim() });
      else await send("/api/admin/permissions/create-permission", "POST", { permissionName: name.trim(), description: description.trim() });
      toast.success(`Created ${name.trim()}`);
      onCreated();
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent data-testid={`create-${kind}-dialog`}>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>New {kind}</DialogTitle>
            <DialogDescription>
              {kind === "role"
                ? "It starts with no permissions. Turn them on in the grid."
                : "A permission does nothing until the code checks for it, so this is mostly for developers."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="create-name">Name</Label>
            <Input id="create-name" value={name} required maxLength={60} onChange={(event) => setName(event.target.value)} placeholder={kind === "role" ? "Editor" : "section.action"} data-testid="create-name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-description">What it&apos;s for</Label>
            <Textarea id="create-description" className="min-h-20" value={description} maxLength={200} onChange={(event) => setDescription(event.target.value)} placeholder="One sentence on what this lets someone do" />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()} data-testid="create-submit">
              {saving ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Every role against every permission. Each cell saves right away, and the server has the final say. */
export function PermissionMatrix({
  roles: initialRoles,
  permissions,
  held,
}: {
  roles: Role[];
  permissions: Permission[];
  /** What the person looking holds. They can't change a permission they don't have. */
  held: string[];
}) {
  const router = useRouter();
  const [roles, setRoles] = useState(initialRoles);
  const [saving, setSaving] = useState<string | null>(null);
  const [creating, setCreating] = useState<"role" | "permission" | null>(null);
  const [lastInitial, setLastInitial] = useState(initialRoles);
  if (initialRoles !== lastInitial) {
    setLastInitial(initialRoles);
    setRoles(initialRoles);
  }

  const toggle = async (role: Role, permission: Permission, on: boolean) => {
    const key = `${role.id}:${permission.id}`;
    const previous = roles;
    setSaving(key);
    setRoles(
      roles.map((item) =>
        item.id === role.id
          ? { ...item, permissionIds: on ? [...item.permissionIds, permission.id] : item.permissionIds.filter((id) => id !== permission.id) }
          : item,
      ),
    );
    try {
      const url = on ? "/api/admin/roles/assign-permission-to-role" : "/api/admin/roles/remove-permission-from-role";
      await send(url, "PUT", { roleId: role.id, permissionId: permission.id });
    } catch (error) {
      setRoles(previous);
      toast.error((error as Error).message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setCreating("role")} data-testid="new-role">
          <Plus className="size-4" aria-hidden />
          New role
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setCreating("permission")} data-testid="new-permission">
          <Plus className="size-4" aria-hidden />
          New permission
        </Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border-2 border-b-4 bg-card">
        <Table className="min-w-[720px]" data-testid="permission-matrix">
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 min-w-56 bg-card">Permission</TableHead>
              {roles.map((role) => (
                <TableHead key={role.id} className="min-w-24 text-center" data-testid="role-column">
                  <span className="block font-extrabold text-foreground">{role.name}</span>
                  <span className="font-medium normal-case">
                    {role.users.toLocaleString()} {role.users === 1 ? "person" : "people"}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((permission) => {
              const canChange = held.includes(permission.name);
              return (
                <TableRow key={permission.id} data-testid="permission-row" data-name={permission.name}>
                  <TableCell className="sticky left-0 z-10 max-w-64 bg-card">
                    <p className="break-words font-extrabold">{permission.name}</p>
                    {permission.description ? <p className="break-words text-xs font-medium text-muted-foreground">{permission.description}</p> : null}
                  </TableCell>
                  {roles.map((role) => {
                    const on = role.permissionIds.includes(permission.id);
                    const key = `${role.id}:${permission.id}`;
                    return (
                      <TableCell key={role.id} className="text-center">
                        <Button
                          type="button"
                          variant="choice"
                          size="icon-lg"
                          role="switch"
                          aria-checked={on}
                          aria-label={`${permission.name} for ${role.name}`}
                          title={canChange ? undefined : "You don't have this permission yourself, so you can't change it"}
                          disabled={!canChange || saving === key}
                          onClick={() => toggle(role, permission, !on)}
                          data-testid="permission-cell"
                          className={cn("disabled:pointer-events-auto disabled:cursor-not-allowed", on && "border-primary bg-primary text-primary-foreground hover:bg-primary")}
                        >
                          {on ? <Check className="size-5" aria-hidden /> : null}
                        </Button>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {creating ? <CreateDialog kind={creating} onClose={() => setCreating(null)} onCreated={() => router.refresh()} /> : null}
    </div>
  );
}
