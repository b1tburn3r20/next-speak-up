import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { can, type PermissionName } from "./permissions";

/**
 * For API routes. Returns the session, or the response to send back.
 *
 *   const access = await requirePermission("roles.manage");
 *   if ("denied" in access) return access.denied;
 */
export async function requirePermission(permission: PermissionName) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { denied: NextResponse.json({ error: "Sign in first." }, { status: 401 }) };
  }
  if (!can(session, permission)) {
    return {
      denied: NextResponse.json(
        { error: "You don't have permission to do that." },
        { status: 403 },
      ),
    };
  }
  return { session };
}
