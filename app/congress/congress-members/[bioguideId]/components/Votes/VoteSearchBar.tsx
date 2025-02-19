"use client";
// VoteSearchBar.tsx
import React, { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import _ from "lodash";

interface VoteSearchBarProps {
  onSearch: (query: string, tags: string[]) => void;
  isLoading: boolean;
}

export function VoteSearchBar({ onSearch, isLoading }: VoteSearchBarProps) {
  const [inputValue, setInputValue] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const debouncedSearch = useCallback(
    _.debounce((query: string, tags: string[]) => {
      onSearch(query, tags);
    }, 300),
    [onSearch]
  );

  const handleSearch = () => {
    // Always trigger search, even with empty input
    onSearch(inputValue.trim(), tags);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (!tags.includes(newTag)) {
        const newTags = [...tags, newTag];
        setTags(newTags);
        setInputValue("");
        onSearch("", newTags);
      }
    } else if (e.key === "Enter") {
      // Always handle Enter, regardless of input value
      handleSearch();
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      const newTags = tags.slice(0, -1);
      setTags(newTags);
      onSearch("", newTags);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    onSearch(inputValue, newTags);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Search votes... (Press Enter to search, comma to add tag)"
          value={inputValue}
          onChange={(e) => {
            const value = e.target.value;
            setInputValue(value);
            if (tags.length > 0) {
              debouncedSearch(value, tags);
            }
          }}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button
          onClick={handleSearch}
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
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
  );
}
