import { SlidersHorizontal, X } from "lucide-react";
import type { ProductFacets } from "../../services/marketplace";
import type { ProductFilters } from "./filterState";
import { CategoryIcon } from "./CategoryIcon";
import { currency, cx } from "../../utils/format";
import { SmartImage, StoreLogo } from "../ui/SmartImage";
import { Rating } from "../ui/Rating";

interface FilterPanelProps {
  filters: ProductFilters;
  onChange: (next: Partial<ProductFilters>) => void;
  facets: ProductFacets | null;
  onReset: () => void;
  categories?: { name: string; slug: string; icon: string; accent: string; productCount?: number }[];
}

const PRICE_STEPS = [10, 25, 50, 100, 250];

export function FilterPanel({ filters, onChange, facets, onReset, categories }: FilterPanelProps) {
  const categoryOptions = categories ?? facets?.categories ?? [];
  const storeOptions = facets?.stores ?? [];
  const activeCount = [
    filters.category,
    filters.store,
    filters.minPrice,
    filters.maxPrice,
    filters.minRating,
    filters.inStock,
    filters.deals,
    filters.delivery,
  ].filter(Boolean).length;

  return (
    <div className="filters">
      <header className="filters__head">
        <h2>
          <SlidersHorizontal size={16} aria-hidden="true" /> Filters
          {activeCount > 0 ? <span className="filters__count">{activeCount}</span> : null}
        </h2>
        {activeCount > 0 ? (
          <button type="button" className="link-plain" onClick={onReset}>
            <X size={13} aria-hidden="true" /> Clear
          </button>
        ) : null}
      </header>

      {categoryOptions.length ? (
        <fieldset className="filters__group">
          <legend>Category</legend>
          <ul>
            {categoryOptions.map((category) => {
              const active = filters.category === category.slug;
              return (
                <li key={category.slug}>
                  <button
                    type="button"
                    className={cx("filters__option", active && "is-active")}
                    onClick={() => onChange({ category: active ? "" : category.slug })}
                    aria-pressed={active}
                  >
                    <CategoryIcon name={category.icon || category.name} size={14} />
                    <span className="filters__option-label">{category.name}</span>
                    {typeof category.productCount === "number" ? (
                      <span className="filters__option-count">{category.productCount}</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ) : null}

      {storeOptions.length ? (
        <fieldset className="filters__group">
          <legend>Store</legend>
          <ul className="filters__stores">
            {storeOptions.map((store) => {
              const active = filters.store === store.slug;
              return (
                <li key={store.slug}>
                  <button
                    type="button"
                    className={cx("filters__option", active && "is-active")}
                    onClick={() => onChange({ store: active ? "" : store.slug })}
                    aria-pressed={active}
                  >
                    <StoreLogo logo={store.logo} name={store.name} size="xs" />
                    <span className="filters__option-label">{store.name}</span>
                    {store.rating ? <Rating value={store.rating.average} size={12} showValue /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ) : null}

      <fieldset className="filters__group">
        <legend>Price</legend>
        <div className="filters__price">
          <label className="field field--inline">
            <span className="sr-only">Minimum price</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder={String(facets?.priceRange.min ?? 0)}
              value={filters.minPrice}
              onChange={(event) => onChange({ minPrice: event.target.value })}
            />
          </label>
          <span aria-hidden="true">–</span>
          <label className="field field--inline">
            <span className="sr-only">Maximum price</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder={String(facets?.priceRange.max ?? 500)}
              value={filters.maxPrice}
              onChange={(event) => onChange({ maxPrice: event.target.value })}
            />
          </label>
        </div>
        <div className="filters__chips">
          {PRICE_STEPS.map((step) => (
            <button
              key={step}
              type="button"
              className={cx("chip", filters.maxPrice === String(step) && "is-active")}
              onClick={() =>
                onChange({ maxPrice: filters.maxPrice === String(step) ? "" : String(step) })
              }
            >
              Under {currency(step, { compact: true })}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="filters__group">
        <legend>Rating</legend>
        <ul>
          {["4.5", "4", "3.5"].map((value) => {
            const active = filters.minRating === value;
            return (
              <li key={value}>
                <button
                  type="button"
                  className={cx("filters__option", active && "is-active")}
                  onClick={() => onChange({ minRating: active ? "" : value })}
                  aria-pressed={active}
                >
                  <Rating value={Number(value)} count={undefined} size={13} showValue={false} />
                  <span className="filters__option-label">{value} & up</span>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <fieldset className="filters__group">
        <legend>Availability & delivery</legend>
        <ul className="filters__switches">
          <li>
            <label className="switch">
              <input
                type="checkbox"
                checked={filters.inStock === "true"}
                onChange={(event) => onChange({ inStock: event.target.checked ? "true" : "" })}
              />
              <span>In stock only</span>
            </label>
          </li>
          <li>
            <label className="switch">
              <input
                type="checkbox"
                checked={filters.deals === "true"}
                onChange={(event) => onChange({ deals: event.target.checked ? "true" : "" })}
              />
              <span>On sale</span>
            </label>
          </li>
          <li>
            <label className="switch">
              <input
                type="checkbox"
                checked={filters.delivery === "free"}
                onChange={(event) => onChange({ delivery: event.target.checked ? "free" : "" })}
              />
              <span>Free delivery</span>
            </label>
          </li>
          <li>
            <label className="switch">
              <input
                type="checkbox"
                checked={filters.delivery === "pickup"}
                onChange={(event) => onChange({ delivery: event.target.checked ? "pickup" : "" })}
              />
              <span>Pickup available</span>
            </label>
          </li>
        </ul>
      </fieldset>
    </div>
  );
}

export function ActiveFilterChips({
  filters,
  onChange,
  onReset,
}: {
  filters: ProductFilters;
  onChange: (next: Partial<ProductFilters>) => void;
  onReset: () => void;
}) {
  const chips: { key: string; label: string; clear: Partial<ProductFilters> }[] = [];
  if (filters.category) {
    chips.push({ key: "category", label: `Category: ${filters.category}`, clear: { category: "" } });
  }
  if (filters.store) {
    chips.push({ key: "store", label: `Store: ${filters.store}`, clear: { store: "" } });
  }
  if (filters.minPrice || filters.maxPrice) {
    chips.push({
      key: "price",
      label: `Price: ${filters.minPrice ? currency(Number(filters.minPrice)) : "$0"} – ${
        filters.maxPrice ? currency(Number(filters.maxPrice)) : "any"
      }`,
      clear: { minPrice: "", maxPrice: "" },
    });
  }
  if (filters.minRating) {
    chips.push({ key: "rating", label: `${filters.minRating}★ & up`, clear: { minRating: "" } });
  }
  if (filters.inStock) chips.push({ key: "stock", label: "In stock", clear: { inStock: "" } });
  if (filters.deals) chips.push({ key: "deals", label: "On sale", clear: { deals: "" } });
  if (filters.delivery) {
    chips.push({
      key: "delivery",
      label: filters.delivery === "free" ? "Free delivery" : "Pickup",
      clear: { delivery: "" },
    });
  }

  if (!chips.length) return null;

  return (
    <div className="active-filters">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          className="chip chip--active"
          onClick={() => onChange(chip.clear)}
        >
          {chip.label}
          <X size={12} aria-hidden="true" />
        </button>
      ))}
      {chips.length > 1 ? (
        <button type="button" className="link-plain" onClick={onReset}>
          Clear all
        </button>
      ) : null}
    </div>
  );
}

export function FacetPreview({ facets }: { facets: ProductFacets | null }) {
  if (!facets) return null;
  return (
    <div className="facet-preview">
      {facets.stores.slice(0, 6).map((store) => (
        <span className="facet-preview__item" key={store.slug}>
          <StoreLogo logo={store.logo} name={store.name} size="xs" />
          {store.name}
        </span>
      ))}
      {facets.categories.slice(0, 6).map((category) => (
        <span className="facet-preview__item" key={category.slug}>
          <SmartImage src={category.image} alt="" ratio="square" fallbackLabel={category.name} />
          {category.name}
        </span>
      ))}
    </div>
  );
}
