// What people are allowed to do. A role has many permissions, and code only ever asks about a
// permission, never a role's name, so a new role works without touching any code.
//
// No server-only imports, so client components can use `can` to decide what to show. The server
// still checks with `requirePermission`, because hiding a button protects nothing.

export const PERMISSIONS = {
  "roles.manage": "Create roles and permissions, and choose which permissions a role has",
  "users.manage": "See every account, and change a person's role",
  "users.search": "Find accounts in search",
  "forum.moderate": "Pin, lock, and delete anyone's forum posts and comments",
  "feedback.view": "Read bug reports and feature ideas",
} as const;

export type PermissionName = keyof typeof PERMISSIONS;

const ALL = Object.keys(PERMISSIONS) as PermissionName[];

/** The permissions each built-in role starts with. They can be changed later on the admin page. */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionName[]> = {
  "Super Admin": ALL,
  Admin: ALL,
  Supporter: [],
  Member: [],
};

type SessionLike = { user?: { permissions?: { name: string }[] } } | null | undefined;

export function can(session: SessionLike, permission: PermissionName): boolean {
  return session?.user?.permissions?.some((item) => item.name === permission) ?? false;
}

export type NavAccess = { permission?: PermissionName; signedIn?: boolean };

/** Whether someone may see something marked with these rules, like a nav link. */
export function canAccess(session: SessionLike & { user?: unknown }, access: NavAccess): boolean {
  if (access.permission) return can(session, access.permission);
  if (access.signedIn) return Boolean(session?.user);
  return true;
}
