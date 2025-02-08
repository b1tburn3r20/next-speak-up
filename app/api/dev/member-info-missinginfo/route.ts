// app/api/dev/member-info-missinginfo/route.ts
import { devService } from "@/lib/services/dev";
import { NextRequest } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { bioguideId, missingContactInfo } = body;

    if (!bioguideId) {
      return new Response("Missing bioguideId", { status: 400 });
    }

    if (typeof missingContactInfo !== "boolean") {
      return new Response("missingContactInfo must be a boolean", {
        status: 400,
      });
    }

    const updatedMember = await devService.toggleMissingContactInfo(
      bioguideId,
      missingContactInfo
    );

    return Response.json(updatedMember);
  } catch (error) {
    console.error("Error updating missing contact info status:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
