import { Check, Search } from "lucide-react";
import { usStateToDistrictMap } from "@/lib/constants/StateToDistictMap";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover-dialog";
import { states } from "@/app/data/states";
import { useEffect, useState } from "react";
import { useUserStore } from "@/app/app/admin/stores/useUserStore";

const DistrictSelect = () => {
  const [open, setOpen] = useState(false);
  const [districts, setDistricts] = useState([]);

  const selectedState = useUserStore((s) => s.userState);
  const value = useUserStore((f) => f.userDistrict);
  const setValue = useUserStore((f) => f.setUserDistrict);
  const numberOfDistrictsInState = usStateToDistrictMap[selectedState];

  useEffect(() => {
    if (selectedState) {
      console.log(numberOfDistrictsInState);

      const districtList = Array.from(
        { length: numberOfDistrictsInState },
        (_, i) => i + 1
      );

      setDistricts(districtList);
      console.log(selectedState, districtList);
    }
  }, [selectedState]);

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
          disabled={!districts.length || !selectedState}
        >
          {value ? (
            value
          ) : (
            <p>
              {selectedState ? "Select District..." : "Select State First..."}
            </p>
          )}
          <Search />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px]">
        <Command>
          <CommandInput
            autoFocus
            placeholder="Select District..."
            className="h-9"
          ></CommandInput>
          <CommandList>
            <CommandEmpty>No State Found...</CommandEmpty>
            <CommandGroup>
              {districts.map((district: number) => (
                <CommandItem
                  key={district}
                  value={String(district)}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  {district}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === String(district) ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default DistrictSelect;
