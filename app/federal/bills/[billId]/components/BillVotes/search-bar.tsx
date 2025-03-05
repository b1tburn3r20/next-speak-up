// components/bill-votes/search-bar.jsx
"use client";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export const SearchBar = ({ searchQuery, setSearchQuery, isSearching }) => {
  return (
    <div className="relative flex-1">
      {isSearching ? (
        <Loader2 className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />
      ) : (
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      )}
      <Input
        placeholder="Search members..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-8"
      />
    </div>
  );
};
