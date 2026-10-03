import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpDown, LayoutGrid, PackageSearch, SlidersHorizontal, X } from "lucide-react";
import { marketplaceService, type ProductFacets } from "../services/marketplace";
import type { Paginated, Product } from "../types";
import { useAsync, useBodyScrollLock, useDebounced } from "../hooks/useAsync";
import { useUniversity } from "../context/UniversityContext";
import { SORTS, cx } from "../utils/format";
import { SearchBar } from "../components/common/SearchBar";
import { ProductGrid } from "../components/common/ProductCard";
import { CategoryStrip } from "../components/common/CategoryCard";
import { PageHeader } from "../components/common/SectionHeader";
import { ActiveFilterChips, FilterPanel } from "../components/common/FilterPanel";
import { EMPTY_FILTERS, type ProductFilters } from "../components/common/filterState";
import { Pagination } from "../components/ui/Pagination";
import {
  EmptyState,
  ErrorState,
  ProductGridSkeleton,
} from "../components/ui/Feedback";

const KEYS = Object.keys(EMPTY_FILTERS) as (keyof ProductFilters)[];

const readFilters = (params: URLSearchParams): ProductFilters => {
  const next = { ...EMPTY_FILTERS };
  KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) next[key] = value;
  });
  return next;
};

export default function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const { university } = useUniversity();
  const [filters, setFilters] = useState<ProductFilters>(() => readFilters(params));
  const [page, setPage] = useState(() => Number(params.get("page")) || 1);
  const [panelOpen, setPanelOpen] = useState(false);
  const debouncedMin = useDebounced(filters.minPrice, 450);
  const debouncedMax = useDebounced(filters.maxPrice, 450);
  useBodyScrollLock(panelOpen);

  const effective = useMemo(
    () => ({ ...filters, minPrice: debouncedMin, maxPrice: debouncedMax }),
    [filters, debouncedMin, debouncedMax]
  );

  const query = useMemo(
    () => ({
      ...effective,
      university: filters.university || university?.code || "",
      page,
      limit: 24,
    }),
    [effective, filters.university, university?.code, page]
  );

  const products = useAsync<Paginated<Product>>(() => marketplaceService.products(query), [
    query.q,
    query.category,
    query.store,
    query.university,
    query.minPrice,
    query.maxPrice,
    query.minRating,
    query.inStock,
    query.deals,
    query.delivery,
    query.sort,
    query.page,
  ]);

  const facets = useAsync<ProductFacets>(
    () => marketplaceService.productFacets({ category: effective.category, university: query.university }),
    [effective.category, query.university]
  );

  const categories = useAsync(
    () => marketplaceService.categories().then((items) => items),
    []
  );

  useEffect(() => {
    const next = new URLSearchParams();
    KEYS.forEach((key) => {
      if (filters[key]) next.set(key, filters[key]);
    });
    if (page > 1) next.set("page", String(page));
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  const update = (next: Partial<ProductFilters>) => {
    setFilters((current) => ({ ...current, ...next }));
    setPage(1);
  };

  const activeCount = KEYS.filter(
    (key) => key !== "sort" && key !== "q" && Boolean(filters[key])
  ).length;

  return (
    <div className="container page">
      <PageHeader
        title={filters.q ? `Results for “${filters.q}”` : "Explore the marketplace"}
        description={
          products.data
            ? `${products.data.pagination.total} product${products.data.pagination.total === 1 ? "" : "s"} from ${
                facets.data?.stores.length ?? "several"
              } campus stores`
            : "Filter by category, store, price, rating and delivery."
        }
      />

      <div className="explore-search">
        <SearchBar variant="page" initialValue={filters.q} onSubmitted={(term) => update({ q: term })} />
      </div>

      {categories.data?.length ? <CategoryStrip categories={categories.data} /> : null}

      <div className="explore">
        <aside className="explore__sidebar" aria-label="Product filters">
          <FilterPanel
            filters={filters}
            onChange={update}
            facets={facets.data}
            categories={categories.data ?? undefined}
            onReset={() => {
              setFilters({ ...EMPTY_FILTERS, q: filters.q });
              setPage(1);
            }}
          />
        </aside>

        <div className="explore__main">
          <div className="explore__toolbar">
            <p className="explore__count">
              {products.loading
                ? "Loading products…"
                : `${products.data?.pagination.total ?? 0} result${
                    products.data?.pagination.total === 1 ? "" : "s"
                  }`}
            </p>
            <div className="explore__toolbar-actions">
              <button
                type="button"
                className="btn btn--secondary btn--sm explore__filter-toggle"
                onClick={() => setPanelOpen(true)}
              >
                <SlidersHorizontal size={15} aria-hidden="true" />
                Filters{activeCount > 0 ? ` (${activeCount})` : ""}
              </button>
              <label className="select-field select-field--sm">
                <ArrowUpDown size={14} aria-hidden="true" />
                <span className="sr-only">Sort results</span>
                <select
                  value={filters.sort}
                  onChange={(event) => update({ sort: event.target.value })}
                >
                  {SORTS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <ActiveFilterChips
            filters={filters}
            onChange={update}
            onReset={() => {
              setFilters({ ...EMPTY_FILTERS, q: filters.q });
              setPage(1);
            }}
          />

          {products.error ? (
            <ErrorState
              title="We could not load products"
              message={products.error}
              onRetry={products.reload}
            />
          ) : null}

          {products.loading && !products.data ? <ProductGridSkeleton count={12} /> : null}

          {products.data && products.data.items.length === 0 ? (
            <EmptyState
              icon={<PackageSearch size={26} aria-hidden="true" />}
              title="No products match those filters"
              description="Try widening your price range, removing a store filter, or searching for something else."
              action={
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => {
                    setFilters(EMPTY_FILTERS);
                    setPage(1);
                  }}
                >
                  Reset all filters
                </button>
              }
            />
          ) : null}

          {products.data && products.data.items.length > 0 ? (
            <>
              <ProductGrid products={products.data.items} />
              <Pagination
                pagination={products.data.pagination}
                onChange={(next) => {
                  setPage(next);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </>
          ) : null}

          <aside className="explore__aside-card">
            <LayoutGrid size={18} aria-hidden="true" />
            <h2>Looking to sell instead?</h2>
            <p>
              Open a free campus store, list your products and reach students who are already
              searching for them.
            </p>
            <Link to="/sell" className="btn btn--primary btn--sm">
              Start selling
            </Link>
          </aside>
        </div>
      </div>

      {panelOpen ? (
        <div className="filter-sheet" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            type="button"
            className="filter-sheet__scrim"
            onClick={() => setPanelOpen(false)}
            aria-label="Close filters"
          />
          <div className="filter-sheet__panel">
            <header className="filter-sheet__head">
              <h2>Filters</h2>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setPanelOpen(false)}
                aria-label="Close filters"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <div className="filter-sheet__body">
              <FilterPanel
                filters={filters}
                onChange={update}
                facets={facets.data}
                categories={categories.data ?? undefined}
                onReset={() => {
                  setFilters({ ...EMPTY_FILTERS, q: filters.q });
                  setPage(1);
                }}
              />
            </div>
            <footer className={cx("filter-sheet__foot")}>
              <button type="button" className="btn btn--primary btn--block" onClick={() => setPanelOpen(false)}>
                Show {products.data?.pagination.total ?? 0} results
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
