import { checkRateLimit, getUserRole } from "@/lib/ratelimiter"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { NextRequest, NextResponse } from "next/server"
import { deletePermission, updatePermission } from "@/lib/services/permissions"
import { can } from "@/lib/auth/permissions";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = getUserRole(session)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unable to validate user" },
        { status: 400 }
      )
    }
    if (!can(session, "roles.manage")) {
      return NextResponse.json({ error: "You don't have permission to do that." }, { status: 403 });
    }
    const rateLimitResult = await checkRateLimit(
      "general",
      userRole,
      session?.user?.id
    )
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: rateLimitResult.error || "Rate limit exceeded",
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset
        },
        { status: 429 }
      )
    }
    const body = await request.json()
    const { permissionId, description } = body
    if (!permissionId) {
      return NextResponse.json(
        { error: "Missing permissionId" },
        { status: 400 }
      )
    }
    await updatePermission(permissionId, description)
    return NextResponse.json(
      { success: true },
      { status: 200 }
    )

  } catch (error) {
    return NextResponse.json(
      { error: "Edgecase broken" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = getUserRole(session)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unable to validate user" },
        { status: 400 }
      )
    }
    if (!can(session, "roles.manage")) {
      return NextResponse.json({ error: "You don't have permission to do that." }, { status: 403 });
    }
    const rateLimitResult = await checkRateLimit(
      "general",
      userRole,
      session?.user?.id
    )
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: rateLimitResult.error || "Rate limit exceeded",
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset
        },
        { status: 429 }
      )
    }
    const body = await request.json()
    const { permissionId } = body
    if (!permissionId) {
      return NextResponse.json(
        { error: "Missing permissionId" },
        { status: 400 }
      )
    }
    await deletePermission(permissionId)
    return NextResponse.json(
      { success: true },
      { status: 200 }
    )

  } catch (error) {
    return NextResponse.json(
      { error: "Edgecase broken" },
      { status: 500 }
    )
  }
} 
