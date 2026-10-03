import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx } from "../../utils/format";
import type { Pagination as PaginationMeta } from "../../types";

interface PaginationProps {
  pagination: PaginationMeta;
  onChange: (page: number) => void;
  className?: string;
}

const buildPages = (current: number, total: number): (number | "gap")[] => {
  if (total <= 7) return Array.from({ length: total }, (_value, index) => index + 1);
  const pages: (number | "gap")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("gap");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < total - 1) pages.push("gap");
  pages.push(total);
  return pages;
};

export function Pagination({ pagination, onChange, className }: PaginationProps) {
  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) {
    return (
      <p className={cx("pagination__summary", className)}>
        Showing all {total} result{total === 1 ? "" : "s"}
      </p>
    );
  }

  return (
    <nav className={cx("pagination", className)} aria-label="Pagination">
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft size={16} aria-hidden="true" />
        Previous
      </button>
      <ul className="pagination__list">
        {buildPages(page, totalPages).map((entry, index) =>
          entry === "gap" ? (
            <li key={`gap-${index}`} className="pagination__gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={entry}>
              <button
                type="button"
                className={cx("pagination__page", entry === page && "is-active")}
                onClick={() => onChange(entry)}
                aria-current={entry === page ? "page" : undefined}
                aria-label={`Page ${entry}`}
              >
                {entry}
              </button>
            </li>
          )
        )}
      </ul>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
        <ChevronRight size={16} aria-hidden="true" />
      </button>
      <p className="pagination__summary">
        Page {page} of {totalPages} · {total} result{total === 1 ? "" : "s"}
      </p>
    </nav>
  );
}
