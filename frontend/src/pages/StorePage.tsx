import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowUpDown,
  BadgeCheck,
  CalendarClock,
  Heart,
  MapPin,
  MessageSquare,
  Package,
  PackageSearch,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { marketplaceService, type StoreDetailResult } from "../services/marketplace";
import type { Product } from "../types";
import { useAsync } from "../hooks/useAsync";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";
import { currency, cx, formatDate, numberCompact, SORTS } from "../utils/format";
import { ProductGrid } from "../components/common/ProductCard";
import { Breadcrumbs, SectionHeader } from "../components/common/SectionHeader";
import { SmartImage, StoreLogo } from "../components/ui/SmartImage";
import { Rating } from "../components/ui/Rating";
import { EmptyState, ErrorState, ProductGridSkeleton } from "../components/ui/Feedback";

const DAY_LABELS: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

export default function StorePage() {
  const { slug = "" } = useParams();
  const wishlist = useWishlist();
  const toast = useToast();
  const [sort, setSort] = useState("recommended");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const { data, loading, error, reload } = useAsync<StoreDetailResult>(
    () => marketplaceService.store(slug, { sort, category, q, page, limit: 24 }),
    [slug, sort, category, q, page]
  );

  if (loading && !data) {
    return (
      <div className="container page">
        <div className="store-hero store-hero--skeleton">
          <div className="skeleton skeleton--media" />
        </div>
        <ProductGridSkeleton count={8} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container page">
        <ErrorState title="We could not load that store" message={error || undefined} onRetry={reload} />
        <p className="page-center">
          <Link to="/stores" className="btn btn--primary">
            Browse all stores
          </Link>
        </p>
      </div>
    );
  }

  const { store, products, reviews, storeCategories } = data;
  const followed = wishlist.hasStore(store._id);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayHours = store.hours?.find((entry) => entry.day === today);
  const isOpen = todayHours ? !todayHours.closed : true;

  const follow = () => wishlist.toggleStore(store);

  return (
    <>
      <section className="store-hero">
        <div className="store-hero__cover">
          <SmartImage src={store.cover} alt={`${store.name} cover`} ratio="wide" fallbackLabel={store.name} />
        </div>
        <div className="container store-hero__body">
          <Breadcrumbs
            items={[
              { label: "Home", to: "/" },
              { label: "Stores", to: "/stores" },
              { label: store.name },
            ]}
          />
          <div className="store-hero__identity">
            <StoreLogo logo={store.logo} name={store.name} size="xl" />
            <div className="store-hero__names">
              <div className="store-hero__title-row">
                <h1>{store.name}</h1>
                {store.verification === "verified" ? (
                  <span className="verified-badge">
                    <span aria-hidden="true">✓</span> Verified
                  </span>
                ) : null}
              </div>
              <p className="store-hero__tagline">{store.tagline}</p>
              <div className="store-hero__meta">
                <Rating value={store.rating?.average || 0} count={store.rating?.count} size={14} />
                <span>
                  <MapPin size={13} aria-hidden="true" /> {store.location?.city}, {store.location?.state}
                </span>
                <span className={cx("store-hero__open", isOpen ? "is-open" : "is-closed")}>
                  <span aria-hidden="true" /> {isOpen ? "Open now" : "Closed now"}
                  {todayHours && !todayHours.closed ? ` · until ${todayHours.close}` : ""}
                </span>
              </div>
            </div>
            <div className="store-hero__actions">
              <button
                type="button"
                className={cx("btn", followed ? "btn--secondary" : "btn--primary")}
                onClick={follow}
              >
                <Heart size={16} fill={followed ? "currentColor" : "none"} aria-hidden="true" />
                {followed ? "Following" : "Follow store"}
              </button>
              <Link to={`/stores/${store.slug}#products`} className="btn btn--ghost">
                <ShoppingBag size={16} aria-hidden="true" />
                Shop products
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container page" id="products">
        {store.promo?.headline ? (
          <div className="store-promo">
            <span className="store-promo__icon">
              <BadgeCheck size={17} aria-hidden="true" />
            </span>
            <div>
              <strong>{store.promo.headline}</strong>
              <em>
                Use code <b>{store.promo.code}</b> for {store.promo.discountPercent}% off
              </em>
            </div>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => {
                navigator.clipboard
                  ?.writeText(store.promo.code)
                  .then(() => toast.success("Code copied", store.promo.code))
                  .catch(() => toast.info("Promo code", store.promo.code));
              }}
            >
              Copy code
            </button>
          </div>
        ) : null}

        <div className="store-layout">
          <div className="store-layout__main">
            <div className="store-toolbar">
              <label className="field field--search">
                <span className="sr-only">Search this store</span>
                <input
                  type="search"
                  value={q}
                  placeholder={`Search ${store.name}`}
                  onChange={(event) => {
                    setQ(event.target.value);
                    setPage(1);
                  }}
                />
              </label>
              <label className="select-field select-field--sm">
                <ArrowUpDown size={14} aria-hidden="true" />
                <span className="sr-only">Sort products</span>
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

            {storeCategories.length > 1 ? (
              <div className="store-categories">
                <button
                  type="button"
                  className={cx("chip", !category && "is-active")}
                  onClick={() => {
                    setCategory("");
                    setPage(1);
                  }}
                >
                  All products
                </button>
                {storeCategories.map((entry) => (
                  <button
                    key={entry._id}
                    type="button"
                    className={cx("chip", category === entry.slug && "is-active")}
                    onClick={() => {
                      setCategory(entry.slug);
                      setPage(1);
                    }}
                  >
                    {entry.name} ({entry.count})
                  </button>
                ))}
              </div>
            ) : null}

            <p className="explore__count">
              {products.pagination.total} product{products.pagination.total === 1 ? "" : "s"}
            </p>

            {products.items.length === 0 ? (
              <EmptyState
                icon={<PackageSearch size={26} aria-hidden="true" />}
                title="No products match that search"
                description="Try a different term or clear the filters to see the full catalogue."
                action={
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => {
                      setQ("");
                      setCategory("");
                      setPage(1);
                    }}
                  >
                    Clear filters
                  </button>
                }
              />
            ) : (
              <>
                <ProductGrid products={products.items} showStore={false} />
                {products.pagination.totalPages > 1 ? (
                  <div className="pager">
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                      disabled={page <= 1}
                    >
                      Previous
                    </button>
                    <span>
                      Page {page} of {products.pagination.totalPages}
                    </span>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => setPage((value) => value + 1)}
                      disabled={page >= products.pagination.totalPages}
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>

          <aside className="store-layout__side">
            <section className="info-card">
              <h2>Delivery & pickup</h2>
              <ul className="info-list">
                <li>
                  <Truck size={15} aria-hidden="true" />
                  <span>
                    <strong>
                      {store.delivery?.fee === 0
                        ? "Free delivery"
                        : `${currency(store.delivery?.fee ?? 0)} delivery`}
                    </strong>
                    <em>
                      {store.delivery?.freeThreshold
                        ? `Free on orders over ${currency(store.delivery.freeThreshold)}`
                        : "Flat fee per order"}
                    </em>
                  </span>
                </li>
                <li>
                  <CalendarClock size={15} aria-hidden="true" />
                  <span>
                    <strong>Arrives in about {store.delivery?.etaMinutes} min</strong>
                    <em>Store sets the estimate</em>
                  </span>
                </li>
                <li>
                  <Package size={15} aria-hidden="true" />
                  <span>
                    <strong>{(store.delivery?.methods || ["Delivery"]).join(" & ")}</strong>
                    <em>Choose at checkout</em>
                  </span>
                </li>
              </ul>
            </section>

            <section className="info-card">
              <h2>Opening hours</h2>
              <ul className="hours">
                {(store.hours || []).map((entry) => (
                  <li key={entry.day} className={cx(entry.day === today && "is-today")}>
                    <span>{DAY_LABELS[entry.day] || entry.day}</span>
                    <span>{entry.closed ? "Closed" : `${entry.open} – ${entry.close}`}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="info-card">
              <h2>Store stats</h2>
              <ul className="info-list">
                <li>
                  <MessageSquare size={15} aria-hidden="true" />
                  <span>
                    <strong>{numberCompact(store.stats?.reviews ?? store.rating?.count ?? 0)} reviews</strong>
                    <em>{store.rating?.average?.toFixed(1)} average rating</em>
                  </span>
                </li>
                <li>
                  <ShoppingBag size={15} aria-hidden="true" />
                  <span>
                    <strong>{numberCompact(store.stats?.orders ?? 0)} orders</strong>
                    <em>Completed on Campora</em>
                  </span>
                </li>
                <li>
                  <Package size={15} aria-hidden="true" />
                  <span>
                    <strong>{numberCompact(store.stats?.products ?? 0)} products</strong>
                    <em>In this catalogue</em>
                  </span>
                </li>
              </ul>
            </section>

            {store.policies ? (
              <section className="info-card">
                <h2>Policies</h2>
                <dl className="policy-list">
                  <div>
                    <dt>Returns</dt>
                    <dd>{store.policies.returns}</dd>
                  </div>
                  <div>
                    <dt>Delivery</dt>
                    <dd>{store.policies.delivery}</dd>
                  </div>
                  <div>
                    <dt>Substitutions</dt>
                    <dd>{store.policies.substitutions}</dd>
                  </div>
                </dl>
              </section>
            ) : null}
          </aside>
        </div>

        {reviews.length > 0 ? (
          <section className="store-reviews">
            <SectionHeader
              eyebrow="Student feedback"
              title={`Recent reviews for ${store.name}`}
              description={`${numberCompact(store.rating?.count ?? 0)} verified reviews · ${
                store.rating?.average?.toFixed(1) || "0"
              } average`}
            />
            <ul className="review-list">
              {reviews.map((review) => (
                <li className="review" key={review._id}>
                  <div className="review__head">
                    <SmartImage
                      src={review.user?.avatar}
                      alt={review.user?.name || "Student"}
                      ratio="square"
                      fallbackLabel={review.user?.name || "Student"}
                    />
                    <div>
                      <p className="review__author">{review.user?.name}</p>
                      <p className="review__meta">
                        <Rating value={review.rating} size={12} showValue={false} />
                        <span>{formatDate(review.createdAt)}</span>
                      </p>
                    </div>
                  </div>
                  {review.title ? <p className="review__title">{review.title}</p> : null}
                  <p className="review__comment">{review.comment}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="section section--tight">
          <SectionHeader
            eyebrow="More to explore"
            title="Browse the rest of the marketplace"
            action={
              <Link to="/explore" className="link-arrow">
                All products
              </Link>
            }
          />
          <NearbyExclusions current={store} />
        </section>
      </div>
    </>
  );
}

function NearbyExclusions({ current }: { current: { _id: string; name: string } }) {
  const { data } = useAsync(
    () => marketplaceService.products({ limit: 4, sort: "popular" }),
    []
  );
  const products: Product[] = (data?.items || []).filter(
    (product) => product.store?._id !== current._id
  );
  if (!products.length) return null;
  return <ProductGrid products={products} />;
}
