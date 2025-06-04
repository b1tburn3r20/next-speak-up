// // app/api/dev/member-info/route.ts
// import { devService } from "@/lib/services/dev";
// import { NextRequest } from "next/server";

// export async function PATCH(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const { bioguideId, contact, website } = body;

//     if (!bioguideId) {
//       return new Response("Missing bioguideId", { status: 400 });
//     }

//     const updatedMember = await devService.updateMemberInfo(bioguideId, {
//       contact,
//       website,
//     });

//     return Response.json(updatedMember);
//   } catch (error) {
//     console.error("Error updating member info:", error);
//     return new Response("Internal Server Error", { status: 500 });
//   }
// }
