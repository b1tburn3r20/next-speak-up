// A record of who changed what in the admin panel. A failure here is logged rather than thrown, so
// it can't undo an action someone has already taken, but every admin action should call this.
import prisma from "@/prisma/client";

type Actor = { id?: string | null; username?: string | null; name?: string | null; email?: string | null };

export function actorName(actor: Actor): string {
  return actor.username || actor.name || actor.email || "Unknown";
}

export async function recordAudit(actor: Actor, action: string, target?: string | null, detail?: string | null) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: actor.id ?? null,
        actorName: actorName(actor).slice(0, 160),
        action: action.slice(0, 60),
        target: target?.slice(0, 191) ?? null,
        detail: detail ?? null,
      },
    });
  } catch (error) {
    console.error("Couldn't record an admin action", action, error);
  }
}
