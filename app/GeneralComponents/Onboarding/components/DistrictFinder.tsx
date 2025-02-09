import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Loader2 } from "lucide-react";
import { STATE_CODES } from "@/lib/constants/state-codes";

export function DistrictFinder({ onDistrictFound }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [district, setDistrict] = useState(null);

  const findDistrictByGeolocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!("geolocation" in navigator)) {
        throw new Error("Geolocation is not supported by your browser");
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, (err) => {
          reject(
            new Error("Please allow location access to find your district")
          );
        });
      });

      const { latitude, longitude } = position.coords;
      const response = await fetch("/api/district/find-by-coordinates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to find district");
      }

      const result = {
        state: STATE_CODES[data.state],
        district: data.district,
      };

      setDistrict(result);
      onDistrictFound(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getOrdinalSuffix = (num) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Find Your Congressional District</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={findDistrictByGeolocation}
          className="w-full"
          variant="outline"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="mr-2 h-4 w-4" />
          )}
          Use My Current Location
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {district && (
          <Alert>
            <AlertDescription>
              You're in {district.state}'s {district.district}
              {getOrdinalSuffix(district.district)} Congressional District
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
