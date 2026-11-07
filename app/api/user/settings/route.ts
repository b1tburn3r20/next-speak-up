// app/api/user/settings/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { userService } from "@/lib/services/user";
import { syncLocationFromProfile } from "@/lib/civic/users";
import { NextResponse } from "next/server";
import { AgeRange, IncomeRange } from "@prisma/client";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const user = await userService.getUserById(session.user.id);
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const data = await request.json();
    const { name, username, ageRange, state, householdIncome, district } = data;

    // Validate username if provided
    if (username) {
      const isAvailable = await userService.isUsernameAvailable(username);
      if (!isAvailable) {
        return new NextResponse("Username is already taken", { status: 400 });
      }
    }

    // Validate ageRange if provided
    if (ageRange && !Object.values(AgeRange).includes(ageRange)) {
      return new NextResponse("Invalid age range", { status: 400 });
    }

    // Validate householdIncome if provided
    if (
      householdIncome &&
      !Object.values(IncomeRange).includes(householdIncome)
    ) {
      return new NextResponse("Invalid income range", { status: 400 });
    }

    // Empty means they cleared it. Left out means it didn't change.
    const districtValue = district === undefined ? undefined : district === null || district === "" ? null : Number(district);
    if (districtValue !== undefined && districtValue !== null && (!Number.isInteger(districtValue) || districtValue < 0)) {
      return new NextResponse("Invalid district", { status: 400 });
    }

    const updatedUser = await userService.updateUserProfile(session.user.id, {
      name,
      username,
      ageRange,
      state,
      householdIncome,
      district: districtValue,
    });
    // Reps are found from the location table, so it has to hear about this too.
    if (state !== undefined || district !== undefined) await syncLocationFromProfile(session.user.id);

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user settings:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    await userService.deleteUser(session.user.id);
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
