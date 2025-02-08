"use client";

import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import LegislationSearchCard from "./LegislationSearchCard";

interface LegislationSearchProps {
  query: string;
  tags: string[];
  onQueryChange: (value: string) => void;
  onTagsChange: (value: string[]) => void;
  onSearch: () => void;
  results: any[];
  totalResults: number;
  isLoading: boolean;
}

const LegislationSearch = ({
  query,
  tags,
  onQueryChange,
  onTagsChange,
  onSearch,
  results,
  totalResults,
  isLoading,
}: LegislationSearchProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onQueryChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (!tags.includes(newTag)) {
        onTagsChange([...tags, newTag]);
        setInputValue("");
        onQueryChange("");
      }
    } else if (e.key === "Enter") {
      onSearch();
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      // Remove the last tag when backspace is pressed on empty input
      const newTags = tags.slice(0, -1);
      onTagsChange(newTags);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSearch = (e: React.MouseEvent) => {
    onSearch();
  };

  const ResultSkeleton = () => (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/5" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Search Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Search by title, number, policy area... (Press Enter to search, comma to add tag)"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isLoading}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:text-primary/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <ResultSkeleton key={i} />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Found {totalResults} results
          </p>

          {results.map((bill) => (
            <LegislationSearchCard
              key={bill.id}
              bill={bill}
              searchQuery={query}
              tags={tags}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No results found
        </div>
      )}
    </div>
  );
};

export default LegislationSearch;
