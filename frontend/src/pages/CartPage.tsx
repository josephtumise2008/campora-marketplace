import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Heart, ShoppingBag, Store, Trash2, Truck } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useUniversity } from "../context/UniversityContext";
import { currency, cx } from "../utils/format";
import { PageHeader } from "../components/common/SectionHeader";
import { SmartImage } from "../components/ui/SmartImage";
import { QuantityStepper } from "../components/ui/QuantityStepper";
import { EmptyState, Spinner } from "../components/ui/Feedback";

export default function CartPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const { campusLabel } = useUniversity();
  const [promo, setPromo] = useState("");
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  const groups = cart.lines.reduce<Record<string, typeof cart.lines>>((acc, line) => {
    const key = line.storeName || "Campus stores";
    acc[key] = acc[key] ? [...acc[key], line] : [line];
    return acc;
  }, {});

  const totals = cart.quote?.totals;

  if (!cart.lines.length) {
    return (
      <div className="container page">
        <PageHeader title="Your cart" />
        <EmptyState
          icon={<ShoppingBag size={26} aria-hidden="true" />}
          title="Your cart is empty"
          description="Add products from any campus store — you can check out across multiple stores in one order."
          action={
            <div className="empty-state__actions">
              <Link to="/explore" className="btn btn--primary">
                Start shopping
              </Link>
              <Link to="/deals" className="btn btn--ghost">
                Browse deals
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="container page">
      <PageHeader
        title="Your cart"
        description={`${cart.count} item${cart.count === 1 ? "" : "s"} · delivering to ${campusLabel}`}
      />

      <div className="cart-page">
        <div className="cart-page__main">
          {Object.entries(groups).map(([storeName, lines]) => (
            <section className="cart-store" key={storeName}>
              <header className="cart-store__head">
                <span className="cart-store__icon">
                  <Store size={15} aria-hidden="true" />
                </span>
                <h2>
                  {lines[0]?.storeSlug ? (
                    <Link to={`/stores/${lines[0].storeSlug}`}>{storeName}</Link>
                  ) : (
                    storeName
                  )}
                </h2>
                <button
                  type="button"
                  className="link-plain"
                  onClick={() => lines.forEach((line) => cart.remove(line.productId))}
                >
                  Remove all
                </button>
              </header>

              <ul>
                {lines.map((line) => (
                  <li className="cart-page__line" key={line.productId}>
                    <Link to={`/products/${line.productId}`} className="cart-page__media">
                      <SmartImage src={line.image} alt={line.name} ratio="square" fallbackLabel={line.name} />
                    </Link>
                    <div className="cart-page__info">
                      <Link to={`/products/${line.productId}`} className="cart-page__name">
                        {line.name}
                      </Link>
                      {line.categoryName ? (
                        <p className="cart-page__meta">{line.categoryName}</p>
                      ) : null}
                      <p className="cart-page__unit">
                        {currency(line.price)}
                        {line.unit && line.unit !== "each" ? ` / ${line.unit}` : ""}
                      </p>
                      <div className="cart-page__controls">
                        <QuantityStepper
                          value={line.quantity}
                          onChange={(value) => cart.setQuantity(line.productId, value)}
                          max={Math.max(line.stock, 1)}
                          allowRemove
                          label={`Quantity for ${line.name}`}
                        />
                        <button
                          type="button"
                          className="link-plain"
                          onClick={() => cart.saveForLater(line.productId)}
                        >
                          <Heart size={13} aria-hidden="true" /> Save for later
                        </button>
                        <button
                          type="button"
                          className="link-plain link-plain--danger"
                          onClick={() => cart.remove(line.productId)}
                        >
                          <Trash2 size={13} aria-hidden="true" /> Remove
                        </button>
                      </div>
                    </div>
                    <p className="cart-page__total">{currency(line.price * line.quantity)}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <Link to="/explore" className="link-arrow cart-page__continue">
            Continue shopping
          </Link>
        </div>

        <aside className="cart-summary">
          <h2>Order summary</h2>

          <div className="cart-summary__rows">
            <div>
              <span>Subtotal</span>
              <span>{cart.quoteLoading ? <Spinner size={13} /> : currency(totals?.subtotal ?? cart.subtotal)}</span>
            </div>
            {totals && totals.discount > 0 ? (
              <div className="cart-summary__discount">
                <span>Promo discount</span>
                <span>-{currency(totals.discount)}</span>
              </div>
            ) : null}
            <div>
              <span>Estimated tax</span>
              <span>{totals ? currency(totals.tax) : "—"}</span>
            </div>
            <div>
              <span>Service fee</span>
              <span>{totals ? currency(totals.serviceFee) : "—"}</span>
            </div>
            <div>
              <span>Delivery</span>
              <span>{totals ? currency(totals.deliveryFee) : "—"}</span>
            </div>
          </div>

          <div className="cart-summary__promo">
            <label className="field">
              <span className="field__label">Promo code</span>
              <input
                value={promo}
                onChange={(event) => setPromo(event.target.value.toUpperCase())}
                placeholder="e.g. CAMPUS10"
              />
            </label>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => {
                setPromoMessage(
                  promo
                    ? `Code ${promo} will be validated at checkout`
                    : "Enter a code from a store to try it"
                );
              }}
            >
              Apply
            </button>
            {promoMessage ? <p className="cart-summary__note">{promoMessage}</p> : null}
          </div>

          <div className="cart-summary__total">
            <span>Total</span>
            <strong>{totals ? currency(totals.total) : currency(cart.subtotal)}</strong>
          </div>

          <button
            type="button"
            className="btn btn--primary btn--block btn--lg"
            onClick={() => navigate("/checkout")}
            disabled={cart.quoteLoading}
          >
            Go to checkout
            <ArrowRight size={17} aria-hidden="true" />
          </button>

          <p className="cart-summary__hint">
            <Truck size={14} aria-hidden="true" /> Free delivery on orders over $35 from each store.
          </p>

          <p className="cart-summary__demo">
            Demo checkout — no real payment is taken. Use card 4242 4242 4242 4242.
          </p>
        </aside>
      </div>

      {cart.saved.length > 0 ? (
        <section className="cart-saved">
          <h2>Saved for later ({cart.saved.length})</h2>
          <ul>
            {cart.saved.map((line) => (
              <li key={line.productId}>
                <SmartImage src={line.image} alt={line.name} ratio="square" fallbackLabel={line.name} />
                <div>
                  <p>{line.name}</p>
                  <em>{currency(line.price)}</em>
                </div>
                <div className="cart-saved__actions">
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={() => cart.moveToCart(line.productId)}
                  >
                    Move to cart
                  </button>
                  <button
                    type="button"
                    className={cx("link-plain link-plain--danger")}
                    onClick={() => cart.removeSaved(line.productId)}
                  >
                    <Trash2 size={13} aria-hidden="true" /> Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
