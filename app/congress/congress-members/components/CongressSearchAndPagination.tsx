// app/congress/congress-members/components/CongressSearchAndPagination.tsx
"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export const CongressSearch = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("query") || "";

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("query") as string;

    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set("query", query);
    } else {
      params.delete("query");
    }
    params.set("page", "1"); // Reset to first page on new search
    router.push(`/congress/congress-members?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
        <Input
          type="search"
          name="query"
          placeholder="Search by name..."
          defaultValue={currentQuery}
          className="pl-8"
        />
      </div>
      <Button type="submit">Search</Button>
    </form>
  );
};

export const CongressPagination = ({
  total,
  currentPage,
  perPage,
}: {
  total: number;
  currentPage: number;
  perPage: number;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / perPage);

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `/congress/congress-members?${params.toString()}`;
  };

  return (
    <div className="flex justify-center gap-2 mt-6">
      <Button
        variant="outline"
        disabled={currentPage <= 1}
        onClick={() => router.push(createPageURL(currentPage - 1))}
      >
        Previous
      </Button>

      <div className="flex items-center gap-2">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNumber: number;
          if (totalPages <= 5) {
            pageNumber = i + 1;
          } else if (currentPage <= 3) {
            pageNumber = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNumber = totalPages - 4 + i;
          } else {
            pageNumber = currentPage - 2 + i;
          }

          return (
            <Button
              key={pageNumber}
              variant={currentPage === pageNumber ? "default" : "outline"}
              onClick={() => router.push(createPageURL(pageNumber))}
            >
              {pageNumber}
            </Button>
          );
        })}
      </div>

      <Button
        variant="outline"
        disabled={currentPage >= totalPages}
        onClick={() => router.push(createPageURL(currentPage + 1))}
      >
        Next
      </Button>
    </div>
  );
};
