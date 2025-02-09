// app/api/user/settings/demographics/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { userService } from "@/lib/services/user";
import { NextResponse } from "next/server";
import { AgeRange, IncomeRange } from "@prisma/client";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { ageRange, householdIncome } = await request.json();

    // Validate age range if provided
    if (ageRange && !Object.values(AgeRange).includes(ageRange)) {
      return new NextResponse("Invalid age range", { status: 400 });
    }

    // Validate income range if provided
    if (
      householdIncome &&
      !Object.values(IncomeRange).includes(householdIncome)
    ) {
      return new NextResponse("Invalid income range", { status: 400 });
    }

    const updatedUser = await userService.updateUserProfile(session.user.id, {
      ageRange,
      householdIncome,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating demographics:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
