import { Link } from "react-router-dom";
import { ArrowRight, MapPin, ShoppingBag, Store as StoreIcon, Truck } from "lucide-react";
import { motion } from "framer-motion";
import type { Store } from "../../types";
import { currency, cx, etaLabel, numberCompact } from "../../utils/format";
import { SmartImage, StoreLogo } from "../ui/SmartImage";
import { Rating } from "../ui/Rating";

export function VerifiedBadge({ verification }: { verification?: string }) {
  if (verification !== "verified") return null;
  return (
    <span className="verified-badge">
      <span aria-hidden="true">✓</span> Verified store
    </span>
  );
}

interface StoreCardProps {
  store: Store;
  index?: number;
  variant?: "card" | "row" | "tile";
}

export function StoreCard({ store, index = 0, variant = "card" }: StoreCardProps) {
  const meta = [
    store.location?.city ? `${store.location.city}, ${store.location.state}` : null,
    store.stats?.products ? `${numberCompact(store.stats.products)} products` : null,
    store.stats?.orders ? `${numberCompact(store.stats.orders)} orders` : null,
  ].filter(Boolean);

  return (
    <motion.article
      className={cx("store-card", `store-card--${variant}`)}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      {variant !== "tile" ? (
        <Link to={`/stores/${store.slug}`} className="store-card__cover" tabIndex={-1} aria-hidden="true">
          <SmartImage src={store.cover} alt={store.name} ratio="wide" fallbackLabel={store.name} />
          {store.promo?.headline ? (
            <span className="store-card__promo">
              <Truck size={13} aria-hidden="true" />
              {store.promo.code ? `${store.promo.code} · ` : ""}
              {store.promo.discountPercent}% off
            </span>
          ) : null}
        </Link>
      ) : null}

      <div className="store-card__body">
        <div className="store-card__identity">
          <StoreLogo logo={store.logo} name={store.name} size={variant === "row" ? "md" : "lg"} />
          <div className="store-card__names">
            <h3 className="store-card__title">
              <Link to={`/stores/${store.slug}`}>{store.name}</Link>
            </h3>
            <p className="store-card__tagline">{store.tagline}</p>
          </div>
        </div>

        <div className="store-card__rating">
          <Rating value={store.rating?.average || 0} count={store.rating?.count} size={13} />
          <VerifiedBadge verification={store.verification} />
        </div>

        <ul className="store-card__meta">
          {meta.map((entry) => (
            <li key={entry}>
              <MapPin size={12} aria-hidden="true" />
              {entry}
            </li>
          ))}
          {store.delivery ? (
            <li>
              <ShoppingBag size={12} aria-hidden="true" />
              {store.delivery.fee === 0
                ? "Free delivery"
                : `${currency(store.delivery.fee)} delivery · ${etaLabel(store.delivery.etaMinutes)}`}
            </li>
          ) : null}
        </ul>

        <Link to={`/stores/${store.slug}`} className="btn btn--secondary btn--sm store-card__cta">
          Visit store
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </motion.article>
  );
}

export function StoreLogoRow({ store }: { store: Store }) {
  return (
    <Link to={`/stores/${store.slug}`} className="store-logo-row">
      <StoreLogo logo={store.logo} name={store.name} size="sm" />
      <span>
        <span className="store-logo-row__name">{store.name}</span>
        <span className="store-logo-row__meta">{store.tagline}</span>
      </span>
    </Link>
  );
}

export function StoreIconTile({
  label,
  to,
  icon,
  meta,
}: {
  label: string;
  to: string;
  icon?: React.ReactNode;
  meta?: string;
}) {
  return (
    <Link to={to} className="store-tile">
      <span className="store-tile__icon">{icon || <StoreIcon size={18} aria-hidden="true" />}</span>
      <span className="store-tile__label">{label}</span>
      {meta ? <span className="store-tile__meta">{meta}</span> : null}
    </Link>
  );
}
