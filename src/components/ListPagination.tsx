import { Fragment, useMemo } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PaginatedResponse } from "@/types/api";

interface ListPaginationProps {
  meta: PaginatedResponse<unknown>["meta"];
  onPageChange: (page: number) => void;
}

export function ListPagination({ meta, onPageChange }: ListPaginationProps) {
  const currentPage = meta.current_page || 1;
  const totalPages = Math.max(1, meta.last_page || 1);

  const visiblePages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    return Array.from(pages)
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b);
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="pt-4">
      <div className="mb-3 text-xs text-muted-foreground">
        Showing {meta.from}-{meta.to} of {meta.total}
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={currentPage === 1}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              onClick={(event) => {
                event.preventDefault();
                if (currentPage > 1) {
                  onPageChange(currentPage - 1);
                }
              }}
            />
          </PaginationItem>
          {visiblePages.map((page, index) => {
            const prev = visiblePages[index - 1];
            const showEllipsis = prev && page - prev > 1;

            return (
              <Fragment key={page}>
                {showEllipsis && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    isActive={page === currentPage}
                    onClick={(event) => {
                      event.preventDefault();
                      if (page !== currentPage) {
                        onPageChange(page);
                      }
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              </Fragment>
            );
          })}
          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={currentPage === totalPages}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              onClick={(event) => {
                event.preventDefault();
                if (currentPage < totalPages) {
                  onPageChange(currentPage + 1);
                }
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
