import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Tr } from "@/components/Tr";
import { pageHref, pageItems } from "@/lib/pagination";

const BASE = "flex h-9 min-w-9 items-center justify-center rounded-sm border px-2 text-sm transition-colors";

/** Page links under a product grid; renders nothing when there is only one page. */
export function Pagination({ page, lastPage, params }: { page: number; lastPage: number; params: { category?: string; search?: string } }) {
  if (lastPage <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={pageHref(params, page - 1)} rel="prev" className={`${BASE} gap-1 border-line text-ink hover:border-gold`}>
          <ChevronLeft className="h-4 w-4" aria-hidden /> <Tr>Page précédente</Tr>
        </Link>
      ) : null}

      {pageItems(page, lastPage).map((item, index) =>
        item === null ? (
          <span key={`gap-${index}`} className="px-1 text-ink-soft" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={item}
            href={pageHref(params, item)}
            aria-current={item === page ? "page" : undefined}
            className={`${BASE} ${item === page ? "border-gold bg-gold font-medium text-on-primary" : "border-line text-ink hover:border-gold"}`}
          >
            {item}
          </Link>
        ),
      )}

      {page < lastPage ? (
        <Link href={pageHref(params, page + 1)} rel="next" className={`${BASE} gap-1 border-line text-ink hover:border-gold`}>
          <Tr>Page suivante</Tr> <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </nav>
  );
}
