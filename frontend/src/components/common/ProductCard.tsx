import { Link } from "react-router-dom";
import { Heart, MapPin, ShoppingBag, Truck } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "../../types";
import { currency, cx, discountPercent, etaLabel } from "../../utils/format";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { useWishlist } from "../../context/WishlistContext";
import { SmartImage, StoreLogo } from "../ui/SmartImage";
import { Rating } from "../ui/Rating";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  showStore?: boolean;
  index?: number;
}

export function ProductCard({ product, compact = false, showStore = true, index = 0 }: ProductCardProps) {
  const cart = useCart();
  const toast = useToast();
  const wishlist = useWishlist();
  const saved = wishlist.hasProduct(product._id);
  const inCart = cart.inCart(product._id);
  const off = discountPercent(product.price, product.compareAtPrice);
  const outOfStock = product.stock <= 0;

  const addToCart = () => {
    if (outOfStock) {
      toast.error("This item is out of stock", "Save it to your list and we will keep it there.");
      return;
    }
    cart.add(product);
  };

  return (
    <motion.article
      className={cx("product-card", compact && "product-card--compact", outOfStock && "is-out")}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.04, 0.24), ease: [0.16, 1, 0.3, 1] }}
    >
      <Link to={`/products/${product._id}`} className="product-card__media" tabIndex={-1} aria-hidden="true">
        <SmartImage src={product.images?.[0]} alt={product.name} ratio="card" fallbackLabel={product.name} />
        <div className="product-card__flags">
          {off > 0 ? <span className="badge badge--danger">-{off}%</span> : null}
          {product.deal?.isDeal && !off ? <span className="badge badge--accent">{product.deal.badge || "Deal"}</span> : null}
          {outOfStock ? <span className="badge badge--neutral">Out of stock</span> : null}
        </div>
      </Link>

      <button
        type="button"
        className={cx("product-card__save", saved && "is-active")}
        onClick={() => wishlist.toggleProduct(product)}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${product.name} from saved items` : `Save ${product.name}`}
      >
        <Heart size={16} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
      </button>

      <div className="product-card__body">
        {showStore && product.store ? (
          <Link to={`/stores/${product.store.slug}`} className="product-card__store">
            <StoreLogo logo={product.store.logo} name={product.store.name} size="xs" />
            <span>{product.store.name}</span>
            {product.store.verification === "verified" ? (
              <span className="verified-dot" title="Verified campus store" aria-label="Verified store">
                ✓
              </span>
            ) : null}
          </Link>
        ) : null}

        <h3 className="product-card__title">
          <Link to={`/products/${product._id}`}>{product.name}</Link>
        </h3>

        <div className="product-card__meta">
          <Rating value={product.rating?.average || 0} count={product.rating?.count} size={13} />
          {product.store?.location?.city ? (
            <span className="product-card__location">
              <MapPin size={12} aria-hidden="true" />
              {product.store.location.city}
            </span>
          ) : null}
        </div>

        <div className="product-card__foot">
          <div className="product-card__price">
            <span className="price price--lg">{currency(product.price)}</span>
            {off > 0 ? <span className="price price--was">{currency(product.compareAtPrice)}</span> : null}
            {product.unit && product.unit !== "each" ? (
              <span className="product-card__unit">/ {product.unit}</span>
            ) : null}
          </div>
          {product.store?.delivery ? (
            <span className="product-card__eta">
              {product.store.delivery.fee === 0 ? (
                <>
                  <Truck size={12} aria-hidden="true" /> Free delivery
                </>
              ) : (
                <>
                  <Truck size={12} aria-hidden="true" /> {etaLabel(product.store.delivery.etaMinutes)}
                </>
              )}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          className={cx("btn btn--primary btn--block btn--sm product-card__cta", inCart && "is-added")}
          onClick={addToCart}
          disabled={outOfStock}
        >
          {outOfStock ? (
            "Out of stock"
          ) : inCart ? (
            <>
              <ShoppingBag size={15} aria-hidden="true" /> Add another
            </>
          ) : (
            <>
              <ShoppingBag size={15} aria-hidden="true" /> Add to cart
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
}

interface ProductGridProps {
  products: Product[];
  compact?: boolean;
  showStore?: boolean;
  className?: string;
}

export function ProductGrid({ products, compact, showStore, className }: ProductGridProps) {
  return (
    <div className={cx("product-grid", className)}>
      {products.map((product, index) => (
        <ProductCard
          key={product._id}
          product={product}
          compact={compact}
          showStore={showStore}
          index={index}
        />
      ))}
    </div>
  );
}
