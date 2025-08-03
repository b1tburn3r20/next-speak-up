// components/bill-votes/filter-popover.jsx
"use client";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings2 } from "lucide-react";

export const FilterPopover = ({ filters, setFilters }) => {
  return (
    <Popover>
      <PopoverTrigger>
        <div className="p-2 hover:bg-muted rounded-md">
          <Settings2 className="h-5 w-5 text-muted-foreground" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="space-y-4">
          <h4 className="font-medium leading-none mb-3">Filter Options</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm">Show only favorites</label>
              <Switch
                checked={filters.showOnlyFavorites}
                onCheckedChange={(checked) =>
                  setFilters((prev) => ({
                    ...prev,
                    showOnlyFavorites: checked,
                  }))
                }
              />
            </div>
            <Separator />
            {Object.entries({
              showYea: "Show Yea votes",
              showNay: "Show Nay votes",
              showPresent: "Show Present",
              showNotVoting: "Show Not Voting",
            }).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-sm">{label}</label>
                <Switch
                  checked={filters[key]}
                  onCheckedChange={(checked) =>
                    setFilters((prev) => ({ ...prev, [key]: checked }))
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
