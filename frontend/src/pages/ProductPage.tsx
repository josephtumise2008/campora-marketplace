import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  Clock3,
  Heart,
  Info,
  MapPin,
  MessageSquare,
  Package,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { marketplaceService, reviewService } from "../services/marketplace";
import type { Product, ProductDetail, Review } from "../types";
import { useAsync } from "../hooks/useAsync";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useWishlist } from "../context/WishlistContext";
import {
  currency,
  cx,
  discountPercent,
  etaLabel,
  formatDate,
  pluralize,
  ratingLabel,
} from "../utils/format";
import { Breadcrumbs, SectionHeader } from "../components/common/SectionHeader";
import { ProductGrid } from "../components/common/ProductCard";
import { SmartImage, StoreLogo } from "../components/ui/SmartImage";
import { Rating, StarPicker } from "../components/ui/Rating";
import { QuantityStepper } from "../components/ui/QuantityStepper";
import { Avatar } from "../components/ui/SmartImage";
import { ErrorState, LoadingBlock } from "../components/ui/Feedback";

interface ProductResponse {
  product: ProductDetail;
  related: Product[];
}

interface ReviewResponse {
  product: { _id: string; name: string; rating: { average: number; count: number } };
  reviews: { items: Review[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean } };
  ratingBuckets: { _id: number; count: number }[];
  userReview: Review | null;
}

function Gallery({ product }: { product: ProductDetail }) {
  const [active, setActive] = useState(0);
  const images = product.images?.length ? product.images : [product.images?.[0]].filter(Boolean) as string[];

  return (
    <div className="gallery">
      <motion.div
        className="gallery__main"
        key={active}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <SmartImage src={images[active]} alt={product.name} ratio="card" fallbackLabel={product.name} />
        {discountPercent(product.price, product.compareAtPrice) > 0 ? (
          <span className="badge badge--danger gallery__flag">
            -{discountPercent(product.price, product.compareAtPrice)}% off
          </span>
        ) : null}
      </motion.div>

      {images.length > 1 ? (
        <div className="gallery__thumbs">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              className={cx("gallery__thumb", index === active && "is-active")}
              onClick={() => setActive(index)}
              aria-label={`View image ${index + 1} of ${product.name}`}
              aria-pressed={index === active}
            >
              <SmartImage src={image} alt="" ratio="square" fallbackLabel={product.name} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StoreSummary({ product }: { product: ProductDetail }) {
  const { store } = product;
  if (!store) return null;

  return (
    <aside className="store-summary">
      <div className="store-summary__head">
        <StoreLogo logo={store.logo} name={store.name} size="lg" />
        <div>
          <h2 className="store-summary__name">
            <Link to={`/stores/${store.slug}`}>{store.name}</Link>
          </h2>
          {store.verification === "verified" ? (
            <span className="verified-badge">
              <span aria-hidden="true">✓</span> Verified campus store
            </span>
          ) : (
            <span className="badge badge--warning">Approval pending</span>
          )}
        </div>
      </div>

      <dl className="store-summary__stats">
        <div>
          <dt>Rating</dt>
          <dd>
            <Rating value={store.rating?.average || 0} count={store.rating?.count} size={13} />
          </dd>
        </div>
        <div>
          <dt>Delivery</dt>
          <dd>
            {store.delivery?.fee === 0
              ? "Free"
              : currency(store.delivery?.fee ?? 0)}{" "}
            · {etaLabel(store.delivery?.etaMinutes)}
          </dd>
        </div>
        <div>
          <dt>Free over</dt>
          <dd>{store.delivery?.freeThreshold ? currency(store.delivery.freeThreshold) : "—"}</dd>
        </div>
        {store.location?.city ? (
          <div>
            <dt>Based in</dt>
            <dd>
              {store.location.city}, {store.location.state}
            </dd>
          </div>
        ) : null}
      </dl>

      {store.policies?.returns ? (
        <p className="store-summary__policy">
          <RotateCcw size={14} aria-hidden="true" /> {store.policies.returns}
        </p>
      ) : null}

      <Link to={`/stores/${store.slug}`} className="btn btn--secondary btn--sm btn--block">
        Visit store
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </aside>
  );
}

function ReviewSection({ product }: { product: ProductDetail }) {
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const [writing, setWriting] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const reviews = useAsync<ReviewResponse>(
    () => reviewService.forProduct(product._id, 1),
    [product._id, isAuthenticated]
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (rating === 0) {
      toast.error("Choose a star rating first");
      return;
    }
    setSaving(true);
    try {
      await reviewService.create({ productId: product._id, rating, title, comment });
      toast.success("Thanks — your review is live", "Verified purchases are marked on every review.");
      setWriting(false);
      setRating(0);
      setTitle("");
      setComment("");
      reviews.reload();
    } catch (err) {
      toast.error("We could not post that review", err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const list = reviews.data?.reviews.items ?? [];
  const total = reviews.data?.reviews.pagination.total ?? 0;
  const userReview = reviews.data?.userReview ?? null;

  return (
    <section className="reviews" id="reviews">
      <SectionHeader
        eyebrow="Verified reviews"
        title={`What students say`}
        description={`${pluralize(total, "review")} · only buyers of this product can review it`}
        action={
          isAuthenticated && !userReview ? (
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => setWriting((v) => !v)}>
              <MessageSquare size={15} aria-hidden="true" />
              Write a review
            </button>
          ) : null
        }
      />

      {userReview ? (
        <p className="reviews__yours">
          <BadgeCheck size={15} aria-hidden="true" /> You reviewed this product — thank you.
        </p>
      ) : null}

      {writing ? (
        <form className="review-form" onSubmit={submit}>
          <h3>Your review</h3>
          <StarPicker value={rating} onChange={setRating} label="Your rating" />
          <label className="field">
            <span className="field__label">Headline</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Sum it up in a few words"
              maxLength={80}
            />
          </label>
          <label className="field">
            <span className="field__label">Your experience</span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              maxLength={600}
              placeholder="What did you order, how was it, and would you buy again?"
            />
          </label>
          <p className="review-form__as">Posting as {user?.name}</p>
          <div className="review-form__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setWriting(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? "Publishing…" : "Publish review"}
            </button>
          </div>
        </form>
      ) : null}

      {reviews.loading && !reviews.data ? <LoadingBlock label="Loading reviews" /> : null}

      {list.length === 0 && !reviews.loading ? (
        <p className="reviews__empty">No reviews yet — be the first to share your experience.</p>
      ) : null}

      <ul className="review-list">
        {list.map((review) => (
          <li className="review" key={review._id}>
            <div className="review__head">
              <Avatar src={review.user?.avatar} name={review.user?.name || "Student"} size={40} />
              <div>
                <p className="review__author">{review.user?.name || "Campus student"}</p>
                <p className="review__meta">
                  <Rating value={review.rating} size={12} showValue={false} />
                  <span>{formatDate(review.createdAt)}</span>
                  {review.verifiedPurchase ? (
                    <span className="review__verified">
                      <BadgeCheck size={12} aria-hidden="true" /> Verified purchase
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
            {review.title ? <p className="review__title">{review.title}</p> : null}
            <p className="review__comment">{review.comment}</p>
          </li>
        ))}
      </ul>

      {reviews.data && reviews.data.reviews.pagination.totalPages > 1 ? (
        <Link to="#reviews" className="link-arrow">
          Load more reviews
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      ) : null}
    </section>
  );
}

export default function ProductPage() {
  const { id = "" } = useParams();
  const cart = useCart();
  const toast = useToast();
  const wishlist = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState<"details" | "delivery" | "seller">("details");
  const [justAdded, setJustAdded] = useState(false);

  const { data, loading, error, reload } = useAsync<ProductResponse>(
    () => marketplaceService.product(id),
    [id]
  );

  const [lastId, setLastId] = useState(id);
  if (lastId !== id) {
    setLastId(id);
    setQuantity(1);
    setJustAdded(false);
  }

  const product = data?.product;
  const off = useMemo(
    () => (product ? discountPercent(product.price, product.compareAtPrice) : 0),
    [product]
  );
  const saved = product ? wishlist.hasProduct(product._id) : false;
  const inCart = product ? cart.quantityOf(product._id) : 0;

  const share = async () => {
    if (!product) return;
    const url = `${window.location.origin}/products/${product._id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: product.description, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied", "Share it with a friend on campus.");
    } catch {
      /* the user dismissed the share sheet */
    }
  };

  if (loading && !data) {
    return (
      <div className="container page">
        <LoadingBlock label="Loading product" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container page">
        <ErrorState
          title="We could not load that product"
          message={error || "It may have been removed by the seller."}
          onRetry={reload}
        />
        <p className="page-center">
          <Link to="/explore" className="btn btn--primary">
            Back to the marketplace
          </Link>
        </p>
      </div>
    );
  }

  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="container page product-page">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Explore", to: "/explore" },
          { label: product.category?.name || "Products", to: `/category/${product.category?.slug}` },
          { label: product.name },
        ]}
      />

      <div className="product-page__top">
        <Gallery product={product} />

        <div className="product-page__info">
          <p className="product-page__store">
            <StoreLogo logo={product.store?.logo} name={product.store?.name || "Store"} size="xs" />
            <Link to={`/stores/${product.store?.slug}`}>{product.store?.name}</Link>
            {product.store?.verification === "verified" ? (
              <span className="verified-dot" title="Verified store" aria-label="Verified store">
                ✓
              </span>
            ) : null}
          </p>

          <h1 className="product-page__title">{product.name}</h1>

          <div className="product-page__rating">
            <Rating value={product.rating?.average || 0} count={product.rating?.count} size={16} />
            {product.rating?.count ? (
              <a href="#reviews" className="link-plain">
                {ratingLabel(product.rating.average)} · read reviews
              </a>
            ) : (
              <span className="product-page__new">New listing</span>
            )}
            {product.soldCount > 0 ? (
              <span className="product-page__sold">{pluralize(product.soldCount, "sold")}</span>
            ) : null}
          </div>

          <p className="product-page__description">{product.description}</p>

          <div className="product-page__price">
            <span className="price price--xl">{currency(product.price)}</span>
            {off > 0 ? (
              <>
                <span className="price price--was price--lg">{currency(product.compareAtPrice)}</span>
                <span className="badge badge--danger">Save {currency(product.compareAtPrice - product.price)}</span>
              </>
            ) : null}
            {product.unit && product.unit !== "each" ? (
              <span className="product-page__unit">per {product.unit}</span>
            ) : null}
          </div>

          <div className="product-page__stock">
            {product.stock > 0 ? (
              <span className={cx("badge", lowStock ? "badge--warning" : "badge--success")}>
                {lowStock ? `Only ${product.stock} left` : `${product.stock} in stock`}
              </span>
            ) : (
              <span className="badge badge--danger">Out of stock</span>
            )}
            {product.sku ? <span className="product-page__sku">SKU {product.sku}</span> : null}
          </div>

          <div className="product-page__delivery">
            <span>
              <Truck size={16} aria-hidden="true" />
              <span>
                <strong>
                  {product.store?.delivery?.fee === 0
                    ? "Free campus delivery"
                    : `${currency(product.store?.delivery?.fee ?? 0)} delivery`}
                </strong>
                <em>Arrives in about {etaLabel(product.store?.delivery?.etaMinutes)}</em>
              </span>
            </span>
            <span>
              <MapPin size={16} aria-hidden="true" />
              <span>
                <strong>
                  {product.store?.location?.city || "Campus"}, {product.store?.location?.state}
                </strong>
                <em>Delivers to your campus</em>
              </span>
            </span>
          </div>

          <div className="product-page__buy">
            <div className="product-page__qty">
              <span className="field__label">Quantity</span>
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={Math.max(product.stock, 1)}
                label="Quantity"
              />
            </div>
            <button
              type="button"
              className={cx("btn btn--primary btn--lg", justAdded && "is-added")}
              onClick={() => {
                cart.add(product, quantity);
                setJustAdded(true);
                window.setTimeout(() => setJustAdded(false), 1400);
              }}
              disabled={product.stock <= 0}
            >
              <ShoppingBag size={18} aria-hidden="true" />
              {product.stock <= 0
                ? "Out of stock"
                : justAdded
                  ? "Added to cart"
                  : `Add to cart · ${currency(product.price * quantity)}`}
            </button>
            <button
              type="button"
              className={cx("icon-btn icon-btn--lg", saved && "is-active")}
              onClick={() => wishlist.toggleProduct(product)}
              aria-pressed={saved}
              aria-label={saved ? "Remove from saved items" : "Save for later"}
            >
              <Heart size={19} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="icon-btn icon-btn--lg"
              onClick={share}
              aria-label="Share this product"
            >
              <Share2 size={18} aria-hidden="true" />
            </button>
          </div>

          {inCart > 0 ? (
            <p className="product-page__incart">
              <ShoppingBag size={14} aria-hidden="true" /> {inCart} already in your{" "}
              <Link to="/cart">cart</Link>
            </p>
          ) : null}

          <div className="product-page__trust">
            <span>
              <ShieldCheck size={15} aria-hidden="true" /> Verified seller
            </span>
            <span>
              <Clock3 size={15} aria-hidden="true" /> Live order updates
            </span>
            <span>
              <Package size={15} aria-hidden="true" /> Campus pickup available
            </span>
          </div>

          <div className="tabs" role="tablist" aria-label="Product information">
            {(["details", "delivery", "seller"] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                className={cx("tab", tab === key && "is-active")}
                onClick={() => setTab(key)}
              >
                {key === "details" ? "Details" : key === "delivery" ? "Delivery & returns" : "Seller"}
              </button>
            ))}
          </div>

          <div className="tab-panel" role="tabpanel">
            {tab === "details" ? (
              <div className="tab-panel__body">
                <p>{product.details || product.description}</p>
                {product.specs?.length ? (
                  <dl className="spec-list">
                    {product.specs.map((spec) => (
                      <div key={spec.label}>
                        <dt>{spec.label}</dt>
                        <dd>{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {product.tags?.length ? (
                  <div className="tag-row">
                    {product.tags.map((tag) => (
                      <Link key={tag} to={`/explore?q=${encodeURIComponent(tag)}`} className="chip">
                        {tag}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {tab === "delivery" ? (
              <div className="tab-panel__body">
                <p>{product.store?.policies?.delivery || "Delivered by the seller on campus."}</p>
                <p>{product.store?.policies?.returns}</p>
                <p>{product.store?.policies?.substitutions}</p>
                <p className="tab-panel__muted">
                  <Info size={14} aria-hidden="true" /> Delivery fees and estimates are set by each
                  store and confirmed at checkout.
                </p>
              </div>
            ) : null}

            {tab === "seller" ? (
              <div className="tab-panel__body">
                <div className="product-page__seller">
                  <StoreLogo logo={product.store?.logo} name={product.store?.name || "Store"} size="lg" />
                  <div>
                    <strong>{product.store?.name}</strong>
                    <em>{product.store?.tagline}</em>
                    <Link to={`/stores/${product.store?.slug}`} className="link-arrow">
                      See the full catalogue
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <StoreSummary product={product} />
      </div>

      <ReviewSection product={product} />

      {data.related.length ? (
        <section className="section section--tight">
          <SectionHeader
            eyebrow="You might also like"
            title="Similar products nearby"
            action={
              <Link to={`/category/${product.category?.slug}`} className="link-arrow">
                More in {product.category?.name}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            }
          />
          <ProductGrid products={data.related} />
        </section>
      ) : null}

      <aside className="product-page__bike">
        <Bike size={20} aria-hidden="true" />
        <p>
          <strong>Group delivery, less waste.</strong> Multiple students on your campus order from the
          same store, so fewer single-item trips leave the shop.
        </p>
      </aside>
    </div>
  );
}
