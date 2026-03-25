
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { NextRequest, NextResponse } from "next/server"
import { deleteRole, updateRole } from "@/lib/services/permissions"

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
    if (!["Admin", "Super Admin"].includes(session?.user?.role.name)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
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
    const { roleId, description } = body
    if (!roleId) {
      return NextResponse.json(
        { error: "Missing roleId" },
        { status: 400 }
      )
    }
    await updateRole(roleId, description)
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
    if (!["Admin", "Super Admin"].includes(session?.user?.role.name)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
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
    const { roleId } = body
    if (!roleId) {
      return NextResponse.json(
        { error: "Missing roleId" },
        { status: 400 }
      )
    }
    await deleteRole(roleId)
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
