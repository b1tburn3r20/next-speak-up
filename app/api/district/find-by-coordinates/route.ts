import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
const FIPS_TO_STATE: Record<string, string> = {
  "01": "Alabama", "02": "Alaska", "04": "Arizona", "05": "Arkansas",
  "06": "California", "08": "Colorado", "09": "Connecticut", "10": "Delaware",
  "11": "District of Columbia", "12": "Florida", "13": "Georgia", "15": "Hawaii",
  "16": "Idaho", "17": "Illinois", "18": "Indiana", "19": "Iowa",
  "20": "Kansas", "21": "Kentucky", "22": "Louisiana", "23": "Maine",
  "24": "Maryland", "25": "Massachusetts", "26": "Michigan", "27": "Minnesota",
  "28": "Mississippi", "29": "Missouri", "30": "Montana", "31": "Nebraska",
  "32": "Nevada", "33": "New Hampshire", "34": "New Jersey", "35": "New Mexico",
  "36": "New York", "37": "North Carolina", "38": "North Dakota", "39": "Ohio",
  "40": "Oklahoma", "41": "Oregon", "42": "Pennsylvania", "44": "Rhode Island",
  "45": "South Carolina", "46": "South Dakota", "47": "Tennessee", "48": "Texas",
  "49": "Utah", "50": "Vermont", "51": "Virginia", "53": "Washington",
  "54": "West Virginia", "55": "Wisconsin", "56": "Wyoming"
}
export async function POST(request: NextRequest) {
  try {
    const { lat, lng } = await request.json()

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "Missing coordinates" }, { status: 400 })
    }

    const censusUrl = new URL(
      "https://geocoding.geo.census.gov/geocoder/geographies/coordinates"
    )
    censusUrl.searchParams.append("x", lng.toString())
    censusUrl.searchParams.append("y", lat.toString())
    censusUrl.searchParams.append("benchmark", "Public_AR_Current")
    censusUrl.searchParams.append("vintage", "Current_Current")
    censusUrl.searchParams.append("layers", "119th Congressional Districts")
    censusUrl.searchParams.append("format", "json")

    const censusRes = await fetch(censusUrl.toString())
    if (!censusRes.ok) throw new Error(`Census API error: ${censusRes.status}`)
    const censusData = await censusRes.json()

    const district = censusData.result?.geographies?.["119th Congressional Districts"]?.[0]
    if (!district) throw new Error("No district found for your location")

    return NextResponse.json({
      state: FIPS_TO_STATE[district.STATE] ?? district.STATE,
      district: district.CD119,
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process location" },
      { status: 500 }
    )
  }
}
