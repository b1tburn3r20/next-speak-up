// app/api/user/onboarding/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { userService } from "@/lib/services/user";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const updatedUser = await userService.toggleOnboardingStatus(
      session.user.id
    );
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error toggling onboarding status:", error);

    if (error instanceof Error && error.message === "User not found") {
      return new NextResponse("User not found", { status: 404 });
    }

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
