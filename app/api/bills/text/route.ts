import { formatBillText } from "@/lib/utils/StringFunctions";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const congress = searchParams.get("congress");
  const type = searchParams.get("type");
  const number = searchParams.get("number");

  // First, fetch the versions list
  const versionsUrl = `https://api.congress.gov/v3/bill/${congress}/${type}/${number}/text?api_key=${process.env.CONGRESS_API_KEY}`;

  try {
    const versionsResponse = await fetch(versionsUrl);
    const versionsData = await versionsResponse.json();

    // Get the most recent version (first in the array)
    const latestVersion = versionsData.textVersions[0];
    if (!latestVersion) {
      return NextResponse.json(
        { error: "No text versions found" },
        { status: 404 }
      );
    }

    // Get the HTML format URL
    const htmlFormat = latestVersion.formats.find(
      (f) => f.type === "Formatted Text"
    );
    if (!htmlFormat) {
      return NextResponse.json(
        { error: "No HTML format available" },
        { status: 404 }
      );
    }

    // Fetch the HTML content
    const htmlResponse = await fetch(htmlFormat.url);
    const htmlText = await htmlResponse.text();

    // Could add some basic HTML-to-text conversion here if needed
    // For now, just return the raw HTML
    const formattedText = formatBillText(htmlText);

    return NextResponse.json({
      text: formattedText,
      version: {
        type: latestVersion.type,
        date: latestVersion.date,
      },
    });
  } catch (error) {
    console.error("Error fetching bill text:", error);
    return NextResponse.json(
      { error: "Failed to fetch bill text" },
      { status: 500 }
    );
  }
}
