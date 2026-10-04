import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useBodyScrollLock } from "../../hooks/useAsync";
import { currency, cx } from "../../utils/format";
import { SmartImage } from "../ui/SmartImage";
import { QuantityStepper } from "../ui/QuantityStepper";
import { Spinner } from "../ui/Feedback";

export function CartDrawer() {
  const cart = useCart();
  const navigate = useNavigate();
  const { isOpen, closeCart } = cart;
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeCart();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeCart]);

  const groups = cart.lines.reduce<Record<string, typeof cart.lines>>((acc, line) => {
    const key = line.storeName || "Campus stores";
    acc[key] = acc[key] ? [...acc[key], line] : [line];
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {cart.isOpen ? (
        <motion.div
          className="drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={cart.closeCart}
        >
          <motion.aside
            className="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Your cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="cart-drawer__head">
              <div>
                <h2>Your cart</h2>
                <p>
                  {cart.count} item{cart.count === 1 ? "" : "s"} from{" "}
                  {Object.keys(groups).length || 0} store{Object.keys(groups).length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={cart.closeCart}
                aria-label="Close cart"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </header>

            {cart.lines.length === 0 ? (
              <div className="cart-drawer__empty">
                <span className="cart-drawer__empty-icon">
                  <ShoppingBag size={26} aria-hidden="true" />
                </span>
                <h3>Your cart is empty</h3>
                <p>Add something from a campus store and it will show up here.</p>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => {
                    cart.closeCart();
                    navigate("/explore");
                  }}
                >
                  Browse products
                </button>
              </div>
            ) : (
              <>
                <div className="cart-drawer__body">
                  {Object.entries(groups).map(([storeName, lines]) => (
                    <section className="cart-group" key={storeName}>
                      <p className="cart-group__title">
                        {lines[0]?.storeSlug ? (
                          <Link to={`/stores/${lines[0].storeSlug}`} onClick={cart.closeCart}>
                            {storeName}
                          </Link>
                        ) : (
                          storeName
                        )}
                      </p>
                      <ul>
                        {lines.map((line) => (
                          <li className="cart-line" key={line.productId}>
                            <Link
                              to={`/products/${line.productId}`}
                              onClick={cart.closeCart}
                              className="cart-line__media"
                            >
                              <SmartImage src={line.image} alt={line.name} ratio="square" fallbackLabel={line.name} />
                            </Link>
                            <div className="cart-line__info">
                              <Link
                                to={`/products/${line.productId}`}
                                className="cart-line__name"
                                onClick={cart.closeCart}
                              >
                                {line.name}
                              </Link>
                              <p className="cart-line__unit">
                                {currency(line.price)}
                                {line.unit && line.unit !== "each" ? ` / ${line.unit}` : ""}
                              </p>
                              <div className="cart-line__controls">
                                <QuantityStepper
                                  size="sm"
                                  value={line.quantity}
                                  max={Math.max(line.stock, 1)}
                                  allowRemove
                                  label={`Quantity for ${line.name}`}
                                  onChange={(value) => cart.setQuantity(line.productId, value)}
                                />
                                <button
                                  type="button"
                                  className="link-plain link-plain--danger"
                                  onClick={() => cart.remove(line.productId)}
                                >
                                  <Trash2 size={13} aria-hidden="true" /> Remove
                                </button>
                              </div>
                            </div>
                            <p className="cart-line__total">{currency(line.price * line.quantity)}</p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>

                <footer className="cart-drawer__foot">
                  <div className="cart-drawer__row">
                    <span>Subtotal</span>
                    <strong>{currency(cart.subtotal)}</strong>
                  </div>
                  <p className="cart-drawer__note">
                    Delivery, service fee and tax are calculated at checkout.
                  </p>
                  {cart.error ? <p className="cart-drawer__error">{cart.error}</p> : null}
                  <button
                    type="button"
                    className={cx("btn btn--primary btn--block")}
                    onClick={() => {
                      cart.closeCart();
                      navigate("/cart");
                    }}
                  >
                    Review cart
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--block btn--sm"
                    onClick={() => {
                      cart.closeCart();
                      navigate("/checkout");
                    }}
                    disabled={cart.quoteLoading}
                  >
                    {cart.quoteLoading ? <Spinner size={14} /> : null}
                    Skip to checkout
                  </button>
                </footer>
              </>
            )}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
