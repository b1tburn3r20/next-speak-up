"use client";

import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { useRouter } from "next/navigation";
import { H } from "@upstash/redis/zmscore-DzNHSWxc";
type BillSearchResult = {
  name_id: string;
  id: number;
  title: string;
  introducedDate: Date | null;
};

const SearchBills = () => {
  const [searchInput, setSearchInput] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);
  const [searchValue] = useDebounce(searchInput, 800);
  const [blurTimeout, setBlurTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(false);
  const router = useRouter();
  const resultItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (searchValue) {
      handleSearch();
    }
  }, [searchValue]);

  useEffect(() => {
    if (results) {
      resultItemRefs.current = new Array(results.length).fill(null);
    }
  }, [results]);

  useEffect(() => {
    if (selectedIndex >= 0 && resultItemRefs.current[selectedIndex]) {
      const selectedElenent = resultItemRefs.current[selectedIndex];
      if (selectedElenent) {
        selectedElenent.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedIndex]);

  const handleBlur = () => {
    const timeout = setTimeout(() => {
      setFocused(false);
    }, 150);
    setBlurTimeout(timeout);
  };
  const handleFocus = () => {
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      setBlurTimeout(null);
    }
    setFocused(true);
  };

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `/api/bills/search-bills?query=${searchValue}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data.results as BillSearchResult[]);
      } else {
        toast.error("Oh no... something went wrong.", {
          position: "top-center",
        });
        console.error("Something went wrong", response);
      }
    } catch (error) {
      console.error("Something went wrong searching", error);
      toast.error(error, { position: "top-center" });
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setSearching(true);
    setSelectedIndex(-1);
  };

  const getResultsState = () => {
    if (searching) {
      return "searching";
    } else if (results?.length > 0) {
      return "results";
    } else if (results?.length === 0) {
      return "no results";
    } else {
      return "dev case";
    }
  };

  const handleSelectedResult = (e: BillSearchResult) => {
    router.push(`/bills/${e.name_id}`);
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
        if (selectedIndex >= 0) {
          handleSelectedResult(results[selectedIndex]);
        }
        break;
      case "Escape":
        setFocused(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const shouldShowResultsContainer =
    (searchInput.length > 0 && focused) ||
    (searching === true && searchInput.length > 0);

  interface SearchResultItemProps {
    result: BillSearchResult;
    index: number;
  }
  const SearchResultItem = ({ result, index }: SearchResultItemProps) => {
    const handleHover = (index) => {
      if (!isKeyboardNavigation) {
        setSelectedIndex(index);
      }
    };
    const handleMouseMove = () => {
      setIsKeyboardNavigation(false);
    };
    return (
      <Link href={`/bills/${result.name_id}`}>
        <div
          ref={(el) => (resultItemRefs.current[index] = el)}
          onMouseOver={() => handleHover(index)}
          onMouseMove={handleMouseMove}
          className={`p-2 border-2 border-primary/50 rounded-xl ${
            index === selectedIndex && "bg-primary text-black"
          }`}
        >
          <div className="flex justify-between items-center">
            <p className="text-lg font-bold">{result.title}</p>
            <p>{result.id} </p>
          </div>
          <p
            className={`italic  uppercase ${
              index === selectedIndex ? "text-black" : "text-muted-foreground"
            }`}
          >
            {result.name_id}{" "}
          </p>
        </div>
      </Link>
    );
  };

  return (
    <div className="relative">
      <Search className="absolute top-4 left-4 text-muted-foreground" />
      <Input
        onFocus={() => handleFocus()}
        onBlur={() => handleBlur()}
        className="border-2 border-primary rounded-full h-14 text-lg pl-14"
        placeholder="Search bills..."
        onKeyDown={(e) => handleKeyDown(e)}
        onChange={(e) => handleSearchChange(e.target.value)}
        value={searchInput}
      />
      {shouldShowResultsContainer && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="absolute h-80 w-full top-[60px] z-[20] rounded-[30px] border-2 border-secondary bg-background overflow-hidden"
        >
          {getResultsState() === "searching" && (
            <div className="w-full h-full flex justify-center items-center">
              <Loader2 className="animate-spin" />
            </div>
          )}
          {getResultsState() === "no results" && "no results"}
          {getResultsState() === "results" && (
            <div className="w-full gap-2 flex flex-col p-2 overflow-auto h-full">
              {results.map((item, index) => (
                <SearchResultItem result={item} index={index} key={item.id} />
              ))}
            </div>
          )}
          {getResultsState() === "dev case" && "Hey alejandro"}
        </div>
      )}
    </div>
  );
};

export default SearchBills;
