// app/api/congress/congress-members/favorite/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { congressService } from "@/lib/services/congress";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");

  try {
    if (memberId) {
      // Check if a specific member is favorited
      const isFavorited = await congressService.isMemberFavorited(
        session.user.id,
        parseInt(memberId)
      );
      return NextResponse.json({ isFavorited });
    }

    // Get all favorites for the user
    const favorites = await congressService.getUserFavorites(session.user.id);
    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("Error getting favorites:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { memberId } = await request.json();
  if (!memberId) {
    return new NextResponse("Member ID is required", { status: 400 });
  }

  try {
    const result = await congressService.toggleFavoriteMember(
      session.user.id,
      memberId
    );
    return NextResponse.json({
      success: true,
      favorite: result,
    });
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
