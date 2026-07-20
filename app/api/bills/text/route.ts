import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getClientIP } from "../../feature-suggestion/route";
import { checkRateLimit } from "@/lib/ratelimiter";
import { Session } from "next-auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const congress = searchParams.get("congress");
  const type = searchParams.get("type");
  const number = searchParams.get("number");
  const cip = getClientIP(request);
  const session: Session = await getServerSession(authOptions);
  const id = session?.user?.id;
  const role = session?.user?.role?.name || "unauthenticated";
  const identifier = id ?? cip;
  const rateLimitResult = await checkRateLimit("general", role, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const versionsUrl = `https://api.congress.gov/v3/bill/${congress}/${type}/${number}/text?api_key=${process.env.CONGRESS_API_KEY}&format=json`;
  try {
    const versionsResponse = await fetch(versionsUrl, {
      headers: { Accept: "application/json" },
    });

    if (!versionsResponse?.ok) {
      const body = await versionsResponse.text();
      console.error("Congress api error:", versionsResponse.status, body);
      return NextResponse.json({ error: "Failed to fetch bc error" }, { status: 502 });
    }

    const versionsData = await versionsResponse.json();

    const latestVersion = versionsData.textVersions[0];

    if (!latestVersion) {
      return NextResponse.json({ error: "No text versions found" }, { status: 404 });
    }


    const htmlFormat = latestVersion.formats.find((f) => f.type === "Formatted Text");

    if (!htmlFormat) {
      return NextResponse.json({ error: "No HTML format available" }, { status: 404 });
    }

    const htmlResponse = await fetch(htmlFormat.url);

    if (!htmlResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch HTML content" }, { status: 502 });
    }

    const htmlText = await htmlResponse.text();

    return NextResponse.json({
      text: htmlText,
      version: {
        type: latestVersion.type,
        date: latestVersion.date,
      },
    });
  } catch (error) {
    console.error("Error fetching bill text:", JSON.stringify(error), error);
    return NextResponse.json({ error: "Failed to fetch bill text" }, { status: 500 });
  }
}
