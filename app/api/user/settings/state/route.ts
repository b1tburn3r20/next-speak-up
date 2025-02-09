// app/api/user/settings/state/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { userService } from "@/lib/services/user";
import { NextResponse } from "next/server";
import { US_STATES } from "@/lib/constants/states";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { state } = await request.json();

    if (!state) {
      return new NextResponse("State is required", { status: 400 });
    }

    // Validate state
    if (!US_STATES.includes(state)) {
      return new NextResponse("Invalid state", { status: 400 });
    }

    const updatedUser = await userService.updateUserProfile(session.user.id, {
      state,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating state:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
