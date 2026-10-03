import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Search, Store, Truck } from "lucide-react";
import { useWishlist } from "../../context/WishlistContext";
import { useAsync } from "../../hooks/useAsync";
import { cx, etaLabel } from "../../utils/format";
import { PageHeader } from "../../components/common/SectionHeader";
import { ProductGrid } from "../../components/common/ProductCard";
import { StoreLogo } from "../../components/ui/SmartImage";
import { Rating } from "../../components/ui/Rating";
import { EmptyState, RowsSkeleton } from "../../components/ui/Feedback";

export default function AccountWishlistPage() {
  const wishlist = useWishlist();
  const [tab, setTab] = useState<"products" | "stores">("products");
  const [q, setQ] = useState("");

  const stores = useAsync(() => Promise.resolve(wishlist.stores), [wishlist.stores.length]);

  const products = wishlist.products.filter((product) =>
    q ? product.name.toLowerCase().includes(q.toLowerCase()) : true
  );
  const followed = wishlist.stores.filter((store) =>
    q ? store.name.toLowerCase().includes(q.toLowerCase()) : true
  );

  return (
    <div className="stack-lg">
      <PageHeader
        title="Saved items"
        description="Products and stores you want to come back to. Everything is stored with your account."
      />

      <div className="filters-toolbar">
        <label className="field field--search">
          <span className="sr-only">Search saved items</span>
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={q}
            placeholder="Search your saved list"
            onChange={(event) => setQ(event.target.value)}
          />
        </label>
        <div className="tab-row" role="tablist" aria-label="Saved item type">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "products"}
            className={cx("tab", tab === "products" && "is-active")}
            onClick={() => setTab("products")}
          >
            Products ({wishlist.productIds.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "stores"}
            className={cx("tab", tab === "stores" && "is-active")}
            onClick={() => setTab("stores")}
          >
            Stores ({wishlist.storeIds.length})
          </button>
        </div>
      </div>

      {wishlist.loading ? <RowsSkeleton count={3} /> : null}

      {tab === "products" ? (
        products.length === 0 && !wishlist.loading ? (
          <EmptyState
            icon={<Heart size={26} aria-hidden="true" />}
            title={q ? "No saved products match" : "No saved products yet"}
            description={
              q
                ? "Try a different search term."
                : "Tap the heart on any product to keep it here for later."
            }
            action={
              <Link to="/explore" className="btn btn--primary">
                Browse products
              </Link>
            }
          />
        ) : (
          <ProductGrid products={products} />
        )
      ) : null}

      {tab === "stores" ? (
        followed.length === 0 && !wishlist.loading ? (
          <EmptyState
            icon={<Store size={26} aria-hidden="true" />}
            title={q ? "No stores match" : "You are not following any stores"}
            description="Follow a store to see its new arrivals and promos first."
            action={
              <Link to="/stores" className="btn btn--primary">
                Browse stores
              </Link>
            }
          />
        ) : (
          <ul className="follow-list">
            {followed.map((store) => (
              <li key={store._id}>
                <StoreLogo logo={store.logo} name={store.name} size="md" />
                <div>
                  <Link to={`/stores/${store.slug}`}>{store.name}</Link>
                  <p>{store.tagline}</p>
                  <span className="follow-list__meta">
                    <Rating value={store.rating?.average || 0} size={12} />
                    <span>
                      <MapPin size={12} aria-hidden="true" /> {store.location?.city}
                    </span>
                    <span>
                      <Truck size={12} aria-hidden="true" />{" "}
                      {store.delivery?.fee === 0
                        ? "Free delivery"
                        : `${etaLabel(store.delivery?.etaMinutes)} delivery`}
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => wishlist.toggleStore(store)}
                >
                  Following
                </button>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {stores.loading ? <RowsSkeleton count={2} /> : null}
    </div>
  );
}
