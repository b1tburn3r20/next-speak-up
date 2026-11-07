import { describe, expect, it } from "vitest";
import {
  canChangeUserRole,
  canGrantPermission,
  canRevokePermission,
  roleChangeLeavesSomeone,
} from "@/lib/auth/role-rules";

const ALL = ["roles.manage", "users.manage", "pipelines.manage"];

describe("canChangeUserRole", () => {
  const base = { actorPermissions: ALL, targetCurrentPermissions: [], newRolePermissions: [], isSelf: false };

  it("allows a change within what you hold", () => {
    expect(canChangeUserRole({ ...base, newRolePermissions: ["users.manage"] })).toEqual({ ok: true });
  });

  it("refuses giving someone a permission you don't have", () => {
    const result = canChangeUserRole({ ...base, actorPermissions: ["users.manage"], newRolePermissions: ["roles.manage"] });
    expect(result.ok).toBe(false);
  });

  it("refuses demoting someone who holds more than you", () => {
    const result = canChangeUserRole({
      ...base,
      actorPermissions: ["users.manage"],
      targetCurrentPermissions: ["users.manage", "roles.manage"],
    });
    expect(result).toMatchObject({ ok: false, reason: expect.stringContaining("permissions you don't") });
  });

  it("refuses changing your own role, whichever way", () => {
    expect(canChangeUserRole({ ...base, isSelf: true }).ok).toBe(false);
  });
});

describe("canGrantPermission", () => {
  it("only lets you grant what you hold, so a role can't be used to climb", () => {
    expect(canGrantPermission({ actorPermissions: ["roles.manage"], permissionName: "users.manage" }).ok).toBe(false);
    expect(canGrantPermission({ actorPermissions: ALL, permissionName: "users.manage" }).ok).toBe(true);
  });
});

describe("canRevokePermission", () => {
  it("only lets you remove what you hold", () => {
    expect(canRevokePermission({ actorPermissions: ["roles.manage"], permissionName: "users.manage", holdersAfter: 5 }).ok).toBe(false);
  });

  it("refuses leaving nobody able to manage roles or people", () => {
    expect(canRevokePermission({ actorPermissions: ALL, permissionName: "roles.manage", holdersAfter: 0 }).ok).toBe(false);
    expect(canRevokePermission({ actorPermissions: ALL, permissionName: "users.manage", holdersAfter: 0 }).ok).toBe(false);
    expect(canRevokePermission({ actorPermissions: ALL, permissionName: "roles.manage", holdersAfter: 1 }).ok).toBe(true);
  });

  it("doesn't mind nobody holding an ordinary permission", () => {
    expect(canRevokePermission({ actorPermissions: ALL, permissionName: "pipelines.manage", holdersAfter: 0 }).ok).toBe(true);
  });
});

describe("roleChangeLeavesSomeone", () => {
  const base = { targetCurrentPermissions: ALL, newRolePermissions: [] as string[] };

  it("refuses removing the last person who can manage roles", () => {
    expect(roleChangeLeavesSomeone({ ...base, otherHolders: { "roles.manage": 0, "users.manage": 3 } }).ok).toBe(false);
  });

  it("allows it when someone else can", () => {
    expect(roleChangeLeavesSomeone({ ...base, otherHolders: { "roles.manage": 1, "users.manage": 1 } }).ok).toBe(true);
  });

  it("doesn't mind if they keep the permission in the new role", () => {
    const result = roleChangeLeavesSomeone({ targetCurrentPermissions: ALL, newRolePermissions: ALL, otherHolders: {} });
    expect(result.ok).toBe(true);
  });
});
