import { NextResponse } from "next/server";

/** What every forum route answers while the forum is shelved. The same 404 as a route that doesn't exist. */
export function forumClosed() {
  return NextResponse.json({ error: "Not found." }, { status: 404 });
}
