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
import { useEffect, useState } from "react";


interface DistrictSelectProps {
  state: string | null
  value: string | null
  onValueChange: (val: string) => void
}
const DistrictSelect = ({ state, value, onValueChange }: DistrictSelectProps) => {
  const [open, setOpen] = useState(false);
  const [districts, setDistricts] = useState([]);


  const numberOfDistrictsInState = usStateToDistrictMap[state];

  useEffect(() => {
    if (state) {
      const districtList = Array.from(
        { length: numberOfDistrictsInState },
        (_, i) => i + 1
      );
      setDistricts(districtList);
    }
  }, [state]);

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-50 justify-between"
          disabled={!districts.length || !state}
        >
          {value ? (
            value
          ) : (
            <p>
              {state ? "Select District..." : "Select State First..."}
            </p>
          )}
          <Search />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-50">
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
                    onValueChange(currentValue === value ? null : currentValue);
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
