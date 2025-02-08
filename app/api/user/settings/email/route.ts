// app/api/user/settings/email/route.ts
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
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return new NextResponse("Invalid email address", { status: 400 });
    }

    // Check if email is already in use
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser && existingUser.id !== session.user.id) {
      return new NextResponse("Email is already in use", { status: 400 });
    }

    const updatedUser = await userService.updateEmail(session.user.id, email);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating email:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
