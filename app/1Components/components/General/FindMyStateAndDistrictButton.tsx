import { Button } from "@/components/ui/button";
import { MapPin, Pin } from "lucide-react";
const FindMyStateAndDistrictButton = () => {
  return (
    <Button className="w-full text-bold">
      Find for me
      <MapPin />
    </Button>
  );
};

export default FindMyStateAndDistrictButton;
