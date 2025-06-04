"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LegislationSearch from "./components/LegislationSearch";
import LegislationPagination from "./components/LegislationPagination";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [tags, setTags] = useState<string[]>([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(0);

  const performSearch = async () => {
    setIsLoading(true);
    try {
      // Construct the search parameters
      const searchQuery = new URLSearchParams();
      if (query) searchQuery.append("query", query);
      if (tags.length > 0) searchQuery.append("tags", JSON.stringify(tags));
      searchQuery.append("page", page.toString());

      const response = await fetch(
        `/api/legislation/search?${searchQuery.toString()}`
      );
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setResults(data.results);
      setTotalPages(data.totalPages);
      setTotalResults(data.total);

      // Update URL
      const urlParams = new URLSearchParams();
      if (query) urlParams.set("q", query);
      if (tags.length > 0) urlParams.set("tags", JSON.stringify(tags));
      urlParams.set("page", page.toString());
      router.push(`?${urlParams.toString()}`);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    performSearch();
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
  };

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
  };

  useEffect(() => {
    performSearch();
  }, [page]);

  // Sync with URL params on initial load
  useEffect(() => {
    const urlQuery = searchParams.get("q");
    const urlTags = searchParams.get("tags");
    const urlPage = Number(searchParams.get("page")) || 1;

    if (urlQuery !== query) {
      setQuery(urlQuery || "");
    }
    if (urlTags) {
      try {
        const parsedTags = JSON.parse(urlTags);
        setTags(parsedTags);
      } catch (e) {
        console.error("Failed to parse tags from URL");
      }
    }
    if (urlPage !== page) {
      setPage(urlPage);
    }
  }, [searchParams]);

  return (
    <div className="space-y-4">
      <LegislationSearch
        query={query}
        tags={tags}
        onQueryChange={handleQueryChange}
        onTagsChange={handleTagsChange}
        onSearch={handleSearch}
        results={results}
        totalResults={totalResults}
        isLoading={isLoading}
      />
      <LegislationPagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading search....</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
