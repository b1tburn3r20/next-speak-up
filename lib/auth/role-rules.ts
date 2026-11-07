// The rules for changing who can do what. Pure, so each one can be tested. The principle throughout:
// nobody can use the panel to gain, or take away, more power than they hold themselves.

export type Refusal = { ok: false; reason: string };
export type Decision = { ok: true } | Refusal;

/** This project compiles without strict mode, where `decision.ok` alone doesn't narrow the type. */
export function refused(decision: Decision): decision is Refusal {
  return !decision.ok;
}

const ALLOW: Decision = { ok: true };
const refuse = (reason: string): Refusal => ({ ok: false, reason });

const subset = (needed: Iterable<string>, held: Set<string>) => [...needed].filter((name) => !held.has(name));

/** Changing someone's role, as checked against what the actor holds. */
export function canChangeUserRole(input: {
  actorPermissions: string[];
  targetCurrentPermissions: string[];
  newRolePermissions: string[];
  isSelf: boolean;
}): Decision {
  const held = new Set(input.actorPermissions);
  if (input.isSelf) return refuse("You can't change your own role. Ask another admin.");
  if (subset(input.newRolePermissions, held).length > 0) {
    return refuse("You can't give someone permissions you don't have yourself.");
  }
  if (subset(input.targetCurrentPermissions, held).length > 0) {
    return refuse("You can't change the role of someone who has permissions you don't.");
  }
  return ALLOW;
}

/** Permissions that, if nobody held them, would lock everyone out of the panel for good. */
export const LOCKOUT_PERMISSIONS = ["roles.manage", "users.manage"];

/** Turning a permission on for a role. */
export function canGrantPermission(input: { actorPermissions: string[]; permissionName: string }): Decision {
  if (!input.actorPermissions.includes(input.permissionName)) {
    return refuse("You can't grant a permission you don't have yourself.");
  }
  return ALLOW;
}

/** Turning a permission off for a role. `holdersAfter` is how many people would still have it. */
export function canRevokePermission(input: {
  actorPermissions: string[];
  permissionName: string;
  holdersAfter: number;
}): Decision {
  if (!input.actorPermissions.includes(input.permissionName)) {
    return refuse("You can't remove a permission you don't have yourself.");
  }
  if (LOCKOUT_PERMISSIONS.includes(input.permissionName) && input.holdersAfter === 0) {
    return refuse(`Nobody would have ${input.permissionName} after this, so no one could undo it.`);
  }
  return ALLOW;
}

/** Whether changing this person's role would leave nobody able to manage roles or people. */
export function roleChangeLeavesSomeone(input: {
  targetCurrentPermissions: string[];
  newRolePermissions: string[];
  /** How many people other than the target hold each lockout permission. */
  otherHolders: Record<string, number>;
}): Decision {
  for (const name of LOCKOUT_PERMISSIONS) {
    const losing = input.targetCurrentPermissions.includes(name) && !input.newRolePermissions.includes(name);
    if (losing && (input.otherHolders[name] ?? 0) === 0) {
      return refuse(`This person is the last one with ${name}, so no one could undo this.`);
    }
  }
  return ALLOW;
}
