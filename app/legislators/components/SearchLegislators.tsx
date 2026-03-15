"use client";

import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import { useRouter } from "next/navigation";
import { TextAnimate } from "@/components/magicui/text-animate";
import { SimpleLandingPageLegislatorData } from "@/lib/types/legislator-types";

interface SearchLegislatorsProps {
  legislators: SimpleLandingPageLegislatorData[];
}

const SearchLegislators = ({ legislators }: SearchLegislatorsProps) => {
  const [searchInput, setSearchInput] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);
  const [searchValue] = useDebounce(searchInput, 800);
  const [blurTimeout, setBlurTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(false);
  const router = useRouter();
  const resultItemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    if (results) {
      resultItemRefs.current = new Array(results.length).fill(null);
    }
  }, [results]);

  useEffect(() => {
    if (selectedIndex >= 0 && resultItemRefs.current[selectedIndex]) {
      resultItemRefs.current[selectedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  const handleBlur = () => {
    const timeout = setTimeout(() => setFocused(false), 150);
    setBlurTimeout(timeout);
  };

  const handleFocus = () => {
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      setBlurTimeout(null);
    }
    setFocused(true);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setSearching(true);
    setSelectedIndex(-1);
    handleFilter(value);
  };

  const handleFilter = (value: string) => {
    if (!value.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    const searchTerm = value.toLowerCase().trim();
    const filteredResults = legislators
      .filter(({ name, state, district }) =>
        name?.toLowerCase().includes(searchTerm) ||
        state?.toLowerCase().includes(searchTerm) ||
        district?.includes(searchTerm)
      )
      .slice(0, 10);
    setResults(filteredResults);
    setSearching(false);
  };

  const getResultsState = () => {
    if (searching) return "searching";
    if (results?.length > 0) return "results";
    if (results?.length === 0) return "no results";
    return "dev case";
  };

  const handleSelectedResult = (e: SimpleLandingPageLegislatorData) => {
    router.push(`/legislators/federal/${e.bioguideId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results || results.length === 0) return;
    setIsKeyboardNavigation(true);
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) handleSelectedResult(results[selectedIndex]);
        break;
      case "Escape":
        setFocused(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const shouldShowResultsContainer =
    (searchInput.length > 0 && focused) ||
    (searching && searchInput.length > 0);

  interface SearchResultItemProps {
    result: SimpleLandingPageLegislatorData;
    index: number;
  }

  const SearchResultItem = ({ result, index }: SearchResultItemProps) => {
    const isActive = index === selectedIndex;

    return (
      <Link
        href={`/legislators/federal/${result.bioguideId}`}
        ref={(el) => (resultItemRefs.current[index] = el)}
        onMouseOver={() => { if (!isKeyboardNavigation) setSelectedIndex(index); }}
        onMouseMove={() => setIsKeyboardNavigation(false)}
        className={`
          flex items-center justify-between w-full px-4 py-3 rounded-xl
          text-sm font-medium transition-all cursor-pointer no-underline
          ${isActive
            ? "bg-primary/80 text-white border border-primary border-b-4 hover:bg-primary/90 active:border-b-0 dark:bg-primary dark:border-green-700/40 dark:hover:bg-primary/90"
            : "bg-background-light text-muted-foreground border-2 border-b-4 hover:bg-muted/40 active:border-b-2"
          }
        `}
      >
        <div className="flex items-center gap-3 min-w-0">
          <p className="font-semibold truncate">
            {result.name}
          </p>
          <span className={`text-xs shrink-0 ${isActive ? "text-white/70" : "text-muted-foreground"}`}>
            {result.state}
          </span>
        </div>
        <p className={`text-xs italic shrink-0 ml-4 ${isActive ? "text-white/80" : "text-muted-foreground"}`}>
          {result.district
            ? `Rep. · District ${result.district}`
            : "Senator"}
        </p>
      </Link>
    );
  };

  return (
    <div className="p-3 rounded-3xl shadow-md bg-background">
      <div className="p-5 rounded-3xl shadow-md bg-background-light">
        <TextAnimate
          animation="blurInUp"
          by="word"
          className="text-2xl sm:text-3xl lg:text-4xl mb-4 sm:mb-6 font-bold [&>span:last-child]:text-primary px-2 sm:px-0"
        >
          Search Legislators
        </TextAnimate>
        <div className="relative">
          <Input
            autoFocus
            onFocus={handleFocus}
            onBlur={handleBlur}
            variant="primary"
            className="text-muted-foreground rounded-full h-14 text-lg px-8"
            placeholder="Search legislators..."
            onKeyDown={handleKeyDown}
            onChange={(e) => handleSearchChange(e.target.value)}
            value={searchInput}
          />
          {shouldShowResultsContainer && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              className="absolute h-80 w-full top-[60px] z-20 rounded-[30px] border bg-background shadow-md overflow-hidden"
            >
              {getResultsState() === "searching" && (
                <div className="w-full h-full flex justify-center items-center">
                  <Loader2 className="animate-spin" />
                </div>
              )}
              {getResultsState() === "no results" && (
                <p className="text-center items-center flex justify-center w-full h-full text-muted-foreground text-sm">
                  No results found
                </p>
              )}
              {getResultsState() === "results" && (
                <div className="w-full flex flex-col gap-1.5 p-3 overflow-auto h-full">
                  {results.map((item, index) => (
                    <SearchResultItem result={item} index={index} key={index} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchLegislators;
