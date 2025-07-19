import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { STATE_CODES } from "@/lib/constants/state-codes";
import { STATE_NAMES } from "@/lib/constants/state-names";
import { useState } from "react";
import LoadingCatch from "@/app/GeneralComponents/Onboarding/components/LoadingCatch";
import { toast } from "sonner";
import { _ } from "@upstash/redis/zmscore-DzNHSWxc";
import { useUserStore } from "@/app/admin/stores/useUserStore";

const FindMyStateAndDistrictButton = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);
  const setUsersDistrict = useUserStore((f) => f.setUserDistrict);
  const setUsersState = useUserStore((f) => f.setUserState);

  const findDistrictByGeolocation = async () => {
    setLoading(true);
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

      const stateCode = STATE_CODES[data.state];
      const result = {
        state: STATE_NAMES[stateCode],
        district: parseInt(data.district),
      };

      setResults(result);
      updateUsersStateAndDistrict(result.state, result.district);
      console.log(result);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateUsersStateAndDistrict = async (state, district) => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/set-state-and-district", {
        method: "PATCH",
        body: JSON.stringify({
          district,
          state,
        }),
      });
      const result = await response.json();
      console.log(result);
      if (response.ok) {
        console.log("We determined its good");
        setUsersState(state);
        setUsersDistrict(district);
      }
    } catch (error) {
      setError(error);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      className="w-full text-bold"
      onClick={() => findDistrictByGeolocation()}
      disabled={loading}
    >
      {loading ? <LoadingCatch /> : <p>Find for me</p>}
      <MapPin />
    </Button>
  );
};

export default FindMyStateAndDistrictButton;
