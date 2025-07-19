import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { AuthSession } from "@/lib/types/user-types";
import { checkRateLimit } from "@/lib/ratelimiter";
import { saveUserStateAndDistrict } from "@/lib/services/user";

export async function PATCH(request: NextRequest) {
  const session: AuthSession = await getServerSession(authOptions);
  const role = session?.user?.role?.name;
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const identifier = session?.user?.id;

  const rateLimitedResult = await checkRateLimit("general", role, identifier);

  if (!rateLimitedResult.success) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  }

  const body = await request.json();

  const { state, district } = body;
  const response = await saveUserStateAndDistrict(
    state,
    district,
    userId,
    role
  );
  if (response.ok) {
    return NextResponse.json({ success: true }, { status: 200 });
  } else {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 400 }
    );
  }
}
