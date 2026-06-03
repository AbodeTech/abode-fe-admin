"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  count: number;
  currentIdx?: number;
  limit?: number;
}

export function Pagination({ count, currentIdx = 1, limit = 10 }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current page from URL or prop fallback
  const currentPage = Number(searchParams.get("page")) || currentIdx;
  const totalPages = Math.ceil(count / limit);

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const handlePageChange = (page: number) => {
    router.push(createPageURL(page), { scroll: false });
  };

  if (totalPages <= 1) return null;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const showMax = 5; // Max number of page buttons to show

    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logic to show truncated pages (e.g., 1, 2, ..., 9, 10 or 4, 5, 6, 7, 8)
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex min-w-0 flex-col gap-3 px-0 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-2">
      <div className="shrink-0 text-center text-xs text-gray-500 sm:text-left sm:text-sm">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex min-w-0 items-center justify-center gap-2 sm:justify-end">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-9 w-9 shrink-0 sm:h-8 sm:w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex max-w-[min(100%,16rem)] flex-wrap items-center justify-center gap-1 overflow-x-auto sm:max-w-none">
          {getPageNumbers().map((page, index) => (
            page === "..." ? (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-400">...</span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(Number(page))}
                className={`h-9 w-9 p-0 sm:h-8 sm:w-8 ${currentPage === page ? "pointer-events-none" : ""}`}
              >
                {page}
              </Button>
            )
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-9 w-9 shrink-0 sm:h-8 sm:w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
