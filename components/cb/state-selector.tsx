import { Check, Search } from "lucide-react";
import { US_STATES } from "@/lib/constants/states";
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
import { useState } from "react";

interface StateSelectProps {
  value: string | null;
  onValueChange: (val: string | null) => void;
}

const StateSelect = ({ value, onValueChange }: StateSelectProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-50 justify-between"
        >
          {value ?? "Select State..."}
          <Search />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-50">
        <Command>
          <CommandInput
            autoFocus
            placeholder="Search states..."
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>No state found.</CommandEmpty>
            <CommandGroup>
              {US_STATES.map((state) => (
                <CommandItem
                  key={state}
                  value={state}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? null : currentValue);
                    setOpen(false);
                  }}
                >
                  {state}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === state ? "opacity-100" : "opacity-0"
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

export default StateSelect;
