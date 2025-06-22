// app/api/user/preferences/route.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import {
  setUserPreference,
  setUserPreferences,
  getUserPreferences,
  deleteUserPreference,
} from "@/lib/services/user-preferances"; // adjust path as needed

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized, no user id", { status: 401 });
  }

  try {
    const result = await getUserPreferences(session.user.id);

    if (result.success) {
      return NextResponse.json(result.preferences, { status: 200 });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error("Get user preferences error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized, no user id", { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, value, preferences } = body;

    // Single preference update
    if (key && value !== undefined) {
      const result = await setUserPreference(session.user.id, key, value);

      if (result.success) {
        return NextResponse.json(result.preference, { status: 200 });
      } else {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
    }

    // Multiple preferences update
    else if (preferences && Array.isArray(preferences)) {
      const result = await setUserPreferences(session.user.id, preferences);

      if (result.success) {
        return NextResponse.json(result.preferences, { status: 200 });
      } else {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
    }

    // Invalid request body
    else {
      return NextResponse.json(
        {
          error:
            "Invalid request. Provide either key/value or preferences array.",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Set user preferences error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized, no user id", { status: 401 });
  }

  try {
    const body = await request.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: "Key is required for deletion" },
        { status: 400 }
      );
    }

    const result = await deleteUserPreference(session.user.id, key);

    if (result.success) {
      return NextResponse.json(
        { message: "Preference deleted successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error("Delete user preference error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
