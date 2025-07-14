import { Check, Search } from "lucide-react";

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
import { useState } from "react";
import { useUserStore } from "@/app/admin/stores/useUserStore";
const StateAndDistrictComboBox = () => {
  const [open, setOpen] = useState(false);

  const setUserState = useUserStore((f) => f.setUserState);
  const userState = useUserStore((f) => f.userState);

  const handleSelect = (e) => {
    setUserState(e);
  };

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {userState
            ? states.find((state) => state === userState)
            : "Select State"}
          <Search />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px]">
        <Command>
          <CommandInput
            autoFocus
            placeholder="Search States..."
            className="h-9"
          ></CommandInput>
          <CommandList>
            <CommandEmpty>No State Found...</CommandEmpty>
            <CommandGroup>
              {states.map((state) => (
                <CommandItem
                  key={state}
                  value={state}
                  onSelect={(currentValue) => {
                    setUserState(
                      currentValue === userState ? "" : currentValue
                    );
                    setOpen(false);
                  }}
                >
                  {state}
                  <Check
                    className={cn(
                      "ml-auto",
                      userState === state ? "opacity-100" : "opacity-0"
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

export default StateAndDistrictComboBox;
