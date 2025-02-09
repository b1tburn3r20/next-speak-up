// app/api/user/settings/username/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { userService } from "@/lib/services/user";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { username } = await request.json();

    if (!username) {
      return new NextResponse("Username is required", { status: 400 });
    }

    // Check username availability
    const isAvailable = await userService.isUsernameAvailable(username);
    if (!isAvailable) {
      return new NextResponse("Username is already taken", { status: 400 });
    }

    const updatedUser = await userService.updateUserProfile(session.user.id, {
      username,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating username:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
