import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { getAllRoles } from "@/lib/services/permissions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthrorized, no user id", { status: 401 });
  }
  try {
    const allRoles = await getAllRoles();
    if (allRoles) {
      return NextResponse.json({ roles: allRoles }, { status: 200 });
    }
  } catch (error) {
    console.error("Something went wrong...");
    return NextResponse.json({ error: error }, { status: 400 });
  }
}
