// Quick checks that a page's main record exists. A detail page does this before it starts streaming,
// so a missing record is a real 404, and the rest of the page can show a skeleton while it loads.
import prisma from "@/prisma/client";

export async function billExists(slug: string): Promise<boolean> {
  return (await prisma.bill.count({ where: { slug } })) > 0;
}

export async function billTextExists(slug: string): Promise<boolean> {
  return (await prisma.bill.count({ where: { slug, textVersions: { some: {} } } })) > 0;
}

export async function rollCallExists(slug: string, rollCallId: number): Promise<boolean> {
  return (await prisma.rollCall.count({ where: { id: rollCallId, bill: { slug } } })) > 0;
}

export async function memberExists(bioguideId: string): Promise<boolean> {
  return (await prisma.personIdentifier.count({ where: { scheme: "bioguide", value: bioguideId } })) > 0;
}

export async function userExists(id: string): Promise<boolean> {
  return (await prisma.user.count({ where: { id } })) > 0;
}

export async function forumPostExists(id: number): Promise<boolean> {
  return (await prisma.forumPost.count({ where: { id } })) > 0;
}
