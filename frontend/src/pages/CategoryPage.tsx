import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowUpDown, ArrowRight, PackageSearch, Store as StoreIcon } from "lucide-react";
import { marketplaceService, type ProductFacets } from "../services/marketplace";
import type { Category, Paginated, Product } from "../types";
import { useAsync } from "../hooks/useAsync";
import { SORTS, cx, numberCompact } from "../utils/format";
import { CategoryIcon } from "../components/common/CategoryIcon";
import { ProductGrid } from "../components/common/ProductCard";
import { Breadcrumbs } from "../components/common/SectionHeader";
import { SmartImage } from "../components/ui/SmartImage";
import { Rating } from "../components/ui/Rating";
import { Pagination } from "../components/ui/Pagination";
import { EmptyState, ErrorState, ProductGridSkeleton } from "../components/ui/Feedback";

interface CategoryResponse {
  category: Category;
  stats: { stores: number; products: number };
}

const priceSteps = [10, 25, 50, 100, 250];

export default function CategoryPage() {
  const { slug = "" } = useParams();
  const [sort, setSort] = useState("recommended");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [dealsOnly, setDealsOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [store, setStore] = useState("");
  const [page, setPage] = useState(1);

  const detail = useAsync<CategoryResponse>(() => marketplaceService.category(slug), [slug]);

  const query = useMemo(
    () => ({
      category: slug,
      sort,
      minPrice,
      maxPrice,
      minRating,
      store,
      deals: dealsOnly ? "true" : "",
      inStock: inStockOnly ? "true" : "",
      page,
      limit: 24,
    }),
    [slug, sort, minPrice, maxPrice, minRating, store, dealsOnly, inStockOnly, page]
  );

  const products = useAsync<Paginated<Product>>(() => marketplaceService.products(query), [
    slug,
    sort,
    minPrice,
    maxPrice,
    minRating,
    store,
    dealsOnly,
    inStockOnly,
    page,
  ]);

  const facets = useAsync<ProductFacets>(
    () => marketplaceService.productFacets({ category: slug }),
    [slug]
  );

  if (detail.error) {
    return (
      <div className="container page">
        <ErrorState
          title="We could not find that category"
          message={detail.error}
          onRetry={detail.reload}
        />
        <p className="page-center">
          <Link to="/explore" className="btn btn--primary">
            Browse all products
          </Link>
        </p>
      </div>
    );
  }

  const category = detail.data?.category;
  const iconName = category ? category.icon || category.name : "search";
  const activeFilters = [store, minPrice, maxPrice, minRating, dealsOnly, inStockOnly].filter(Boolean)
    .length;

  return (
    <>
      <section
        className="category-hero"
        style={{ ["--tile-accent" as string]: category?.accent || "var(--brand-500)" }}
      >
        <div className="container">
          <Breadcrumbs
            items={[
              { label: "Home", to: "/" },
              { label: "Categories", to: "/explore" },
              { label: category?.name || "Loading…" },
            ]}
          />
          <div className="category-hero__inner">
            <span className="category-hero__media">
              <SmartImage
                src={category?.image}
                alt={category?.name || "Category"}
                ratio="square"
                fallbackLabel={category?.name || "Category"}
              />
              <span className="category-hero__icon" aria-hidden="true">
                {category ? (
                  <CategoryIcon name={iconName} size={20} />
                ) : (
                  <PackageSearch size={20} aria-hidden="true" />
                )}
              </span>
            </span>
            <div className="category-hero__copy">
              <p className="eyebrow">Category</p>
              <h1 className="page-title">{category?.name || "…"}</h1>
              <p className="page-description">{category?.description || category?.tagline}</p>
              {detail.data ? (
                <p className="category-hero__stats">
                  <span>
                    <strong>{numberCompact(detail.data.stats.products)}</strong> products
                  </span>
                  <span>
                    <strong>{detail.data.stats.stores}</strong> stores
                  </span>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="container page">
        <div className="explore">
          <aside className="explore__sidebar" aria-label="Category filters">
            <div className="filters">
              <h2 className="filters__head">Refine</h2>

              {facets.data?.stores?.length ? (
                <fieldset className="filters__group">
                  <legend>Store</legend>
                  <ul>
                    {facets.data.stores.map((entry) => (
                      <li key={entry.slug}>
                        <button
                          type="button"
                          className={cx("filters__option", store === entry.slug && "is-active")}
                          onClick={() => {
                            setStore(store === entry.slug ? "" : entry.slug);
                            setPage(1);
                          }}
                          aria-pressed={store === entry.slug}
                        >
                          <span className="filters__option-label">{entry.name}</span>
                          {entry.rating ? (
                            <Rating value={entry.rating.average} size={12} showValue />
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              ) : null}

              <fieldset className="filters__group">
                <legend>Max price</legend>
                <div className="filters__price">
                  <label className="field field--inline">
                    <span className="sr-only">Minimum price</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={minPrice}
                      onChange={(event) => {
                        setMinPrice(event.target.value);
                        setPage(1);
                      }}
                    />
                  </label>
                  <span aria-hidden="true">–</span>
                  <label className="field field--inline">
                    <span className="sr-only">Maximum price</span>
                    <input
                      type="number"
                      min={0}
                      placeholder={String(facets.data?.priceRange.max ?? 500)}
                      value={maxPrice}
                      onChange={(event) => {
                        setMaxPrice(event.target.value);
                        setPage(1);
                      }}
                    />
                  </label>
                </div>
                <div className="filters__chips">
                  {priceSteps.map((step) => (
                    <button
                      key={step}
                      type="button"
                      className={cx("chip", maxPrice === String(step) && "is-active")}
                      onClick={() => {
                        setMaxPrice(maxPrice === String(step) ? "" : String(step));
                        setPage(1);
                      }}
                    >
                      Under ${step}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="filters__group">
                <legend>Filters</legend>
                <ul className="filters__switches">
                  <li>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(event) => {
                          setInStockOnly(event.target.checked);
                          setPage(1);
                        }}
                      />
                      <span>In stock only</span>
                    </label>
                  </li>
                  <li>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={dealsOnly}
                        onChange={(event) => {
                          setDealsOnly(event.target.checked);
                          setPage(1);
                        }}
                      />
                      <span>On sale</span>
                    </label>
                  </li>
                </ul>
              </fieldset>

              {activeFilters > 0 ? (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm btn--block"
                  onClick={() => {
                    setStore("");
                    setMinPrice("");
                    setMaxPrice("");
                    setMinRating("");
                    setDealsOnly(false);
                    setInStockOnly(false);
                    setPage(1);
                  }}
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </aside>

          <div className="explore__main">
            <div className="explore__toolbar">
              <p className="explore__count">
                {products.loading
                  ? "Loading products…"
                  : `${products.data?.pagination.total ?? 0} product${
                      products.data?.pagination.total === 1 ? "" : "s"
                    }`}
              </p>
              <label className="select-field select-field--sm">
                <ArrowUpDown size={14} aria-hidden="true" />
                <span className="sr-only">Sort</span>
                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value);
                    setPage(1);
                  }}
                >
                  {SORTS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {products.error ? (
              <ErrorState message={products.error} onRetry={products.reload} />
            ) : null}

            {products.loading && !products.data ? <ProductGridSkeleton count={8} /> : null}

            {products.data && products.data.items.length === 0 ? (
              <EmptyState
                icon={<PackageSearch size={26} aria-hidden="true" />}
                title="Nothing here yet"
                description="No products in this category match your filters yet."
                action={
                  <Link to="/explore" className="btn btn--primary">
                    Browse the whole marketplace
                  </Link>
                }
              />
            ) : null}

            {products.data && products.data.items.length > 0 ? (
              <>
                <ProductGrid products={products.data.items} showStore />
                <Pagination
                  pagination={products.data.pagination}
                  onChange={(next) => {
                    setPage(next);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </>
            ) : null}
          </div>
        </div>

        <section className="category-cta">
          <span className="category-cta__icon">
            <StoreIcon size={18} aria-hidden="true" />
          </span>
          <div>
            <h2>Sell {category?.name?.toLowerCase() || "products"} on Campora</h2>
            <p>
              Students on your campus are already searching this category. Open a store and reach them
              today.
            </p>
          </div>
          <Link to="/sell" className="btn btn--accent">
            Start selling
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </>
  );
}
