import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpDown, Tag, Timer } from "lucide-react";
import { marketplaceService } from "../services/marketplace";
import type { Paginated, Product } from "../types";
import { useAsync } from "../hooks/useAsync";
import { SORTS } from "../utils/format";
import { ProductGrid } from "../components/common/ProductCard";
import { PageHeader } from "../components/common/SectionHeader";
import { Pagination } from "../components/ui/Pagination";
import { EmptyState, ProductGridSkeleton } from "../components/ui/Feedback";

export default function DealsPage() {
  const [sort, setSort] = useState("deals");
  const [page, setPage] = useState(1);

  const query = useMemo(
    () => ({ deals: "true", inStock: "true", sort, page, limit: 24 }),
    [sort, page]
  );

  const { data, loading } = useAsync<Paginated<Product>>(
    () => marketplaceService.products(query),
    [sort, page]
  );

  return (
    <div className="container page">
      <PageHeader
        eyebrow="Limited time"
        title="Campus deals"
        description="Discounts set by verified campus sellers. Prices include everything — no extra fees at checkout."
      />

      <div className="deals-banner">
        <div>
          <span className="deals-banner__icon">
            <Tag size={18} aria-hidden="true" />
          </span>
          <div>
            <h2>Everything below is marked down</h2>
            <p>
              Sellers set their own promotions, so stock moves fast. Free campus delivery still
              applies on orders over $35 from each store.
            </p>
          </div>
        </div>
        <span className="deals-banner__meta">
          <Timer size={15} aria-hidden="true" /> {data?.pagination.total ?? 0} live deals
        </span>
      </div>

      <div className="explore__toolbar">
        <p className="explore__count">
          {loading ? "Loading deals…" : `${data?.pagination.total ?? 0} products on sale`}
        </p>
        <label className="select-field select-field--sm">
          <ArrowUpDown size={14} aria-hidden="true" />
          <span className="sr-only">Sort deals</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && !data ? <ProductGridSkeleton count={8} /> : null}

      {data && data.items.length === 0 ? (
        <EmptyState
          title="No live deals right now"
          description="Sellers refresh their promotions regularly — check back soon or browse the full marketplace."
          action={
            <Link to="/explore" className="btn btn--primary">
              Browse all products
            </Link>
          }
        />
      ) : null}

      {data && data.items.length > 0 ? (
        <>
          <ProductGrid products={data.items} />
          <Pagination
            pagination={data.pagination}
            onChange={(next) => {
              setPage(next);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      ) : null}
    </div>
  );
}
