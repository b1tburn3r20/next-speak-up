import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { latitude, longitude } = await request.json();

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "Missing coordinates" },
        { status: 400 }
      );
    }

    const censusUrl = new URL(
      "https://geocoding.geo.census.gov/geocoder/geographies/coordinates"
    );

    censusUrl.searchParams.append("x", longitude.toString());
    censusUrl.searchParams.append("y", latitude.toString());
    censusUrl.searchParams.append("benchmark", "Public_AR_Current");
    censusUrl.searchParams.append("vintage", "Current_Current");
    censusUrl.searchParams.append("layers", "119th Congressional Districts");
    censusUrl.searchParams.append("format", "json");

    const response = await fetch(censusUrl.toString());

    if (!response.ok) {
      throw new Error(`Census API responded with status: ${response.status}`);
    }

    const data = await response.json();

    const district =
      data.result?.geographies?.["119th Congressional Districts"]?.[0];

    if (!district) {
      throw new Error("No district found for these coordinates");
    }

    return NextResponse.json({
      state: district.STATE,
      district: district.CD119,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process location",
        details: "Please try entering your address instead",
      },
      { status: 500 }
    );
  }
}
