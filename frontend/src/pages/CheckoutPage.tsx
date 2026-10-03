import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CreditCard,
  Info,
  Lock,
  MapPin,
  Store,
  Truck,
  Wallet,
} from "lucide-react";
import { orderService, userService } from "../services/marketplace";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useUniversity } from "../context/UniversityContext";
import type { Address } from "../types";
import { currency, cx } from "../utils/format";
import { SmartImage } from "../components/ui/SmartImage";
import { Spinner } from "../components/ui/Feedback";

const STEPS = ["Delivery", "Payment", "Review"] as const;

interface FormState {
  recipient: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  instructions: string;
}

const emptyForm: FormState = {
  recipient: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
  instructions: "",
};

export default function CheckoutPage() {
  const cart = useCart();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { campusLabel, university } = useUniversity();

  const [step, setStep] = useState(0);
  const [method, setMethod] = useState<"Delivery" | "Pickup">("Delivery");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<string>("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [card, setCard] = useState({ cardNumber: "", expiry: "", cvc: "" });
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const deliveryIssues = useMemo(() => {
    const next: Record<string, string> = {};
    if (!form.recipient.trim()) next.recipient = "Add the name for this delivery";
    if (!form.line1.trim()) next.line1 = "Add a street address";
    if (!form.city.trim()) next.city = "Add a city";
    if (!form.state.trim()) next.state = "Add a state";
    if (!form.zip.trim()) next.zip = "Add a ZIP code";
    if (form.phone && form.phone.replace(/\D/g, "").length < 7) {
      next.phone = "Enter a valid phone number";
    }
    return next;
  }, [form]);

  const paymentIssues = useMemo(() => {
    const next: Record<string, string> = {};
    const digits = card.cardNumber.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) next.cardNumber = "Enter a 13–19 digit card number";
    if (!/^\d{2}\s*\/\s*\d{2}$/.test(card.expiry)) next.expiry = "Use MM/YY";
    if (!/^\d{3,4}$/.test(card.cvc)) next.cvc = "3 or 4 digits";
    return next;
  }, [card]);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const list = await userService.addresses();
        setAddresses(list);
        const preferred = list.find((entry) => entry.isDefault) || list[0];
        if (preferred) {
          setAddressId(preferred._id);
          setForm({
            recipient: preferred.recipient,
            line1: preferred.line1,
            line2: preferred.line2 || "",
            city: preferred.city,
            state: preferred.state,
            zip: preferred.zip,
            phone: preferred.phone || user?.phone || "",
            instructions: preferred.instructions || "",
          });
        }
      } catch {
        /* the customer can still type an address manually */
      }
    })();
  }, [isAuthenticated, user?.phone]);

  // Pre-fill the delivery form from the account and campus profile once they
  // load, without overwriting anything the shopper has already typed.
  const prefillKey = `${user?.name || ""}|${user?.phone || ""}|${university?.city || ""}|${university?.state || ""}`;
  const [lastPrefill, setLastPrefill] = useState(prefillKey);
  if (lastPrefill !== prefillKey) {
    setLastPrefill(prefillKey);
    setForm((current) => ({
      ...current,
      recipient: current.recipient || user?.name || "",
      phone: current.phone || user?.phone || "",
      city: current.city || university?.city || "",
      state: current.state || university?.state || "",
    }));
  }

  type CartLine = (typeof cart.lines)[number];
  const lines = cart.lines;
  const groups = useMemo(
    () =>
      lines.reduce<Record<string, CartLine[]>>((acc, line) => {
        const key = line.storeName || "Campus stores";
        acc[key] = acc[key] ? [...acc[key], line] : [line];
        return acc;
      }, {}),
    [lines]
  );

  useEffect(() => {
    void cart.refreshQuote(method);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method]);

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="container page">
        <div className="checkout-gate">
          <span className="checkout-gate__icon">
            <Lock size={24} aria-hidden="true" />
          </span>
          <h1>Sign in to check out</h1>
          <p>Your cart is saved. Log in or create an account to finish your order.</p>
          <div className="checkout-gate__actions">
            <Link to="/login?redirect=/checkout" className="btn btn--primary">
              Log in
            </Link>
            <Link to="/register?redirect=/checkout" className="btn btn--ghost">
              Create account
            </Link>
            <Link to="/cart" className="link-arrow">
              Back to cart
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!cart.lines.length) {
    return (
      <div className="container page">
        <div className="checkout-gate">
          <h1>Your cart is empty</h1>
          <p>Add something to your cart before checking out.</p>
          <Link to="/explore" className="btn btn--primary">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  const validateDelivery = () => {
    setErrors(deliveryIssues);
    return Object.keys(deliveryIssues).length === 0;
  };

  const validatePayment = () => {
    setErrors(paymentIssues);
    return Object.keys(paymentIssues).length === 0;
  };

  const placeOrder = async () => {
    const deliveryOk = validateDelivery();
    const paymentOk = validatePayment();
    if (!deliveryOk || !paymentOk) {
      setStep(deliveryOk ? 1 : 0);
      return;
    }
    setPlacing(true);
    try {
      const order = await orderService.create({
        items: cart.lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        deliveryAddress: { ...form, type: "dorm" },
        deliveryMethod: method,
        payment: { method: "Demo Card", ...card },
        customerNote: note,
      });
      cart.clear();
      toast.success("Order placed", `${order.orderNumber} is confirmed.`);
      navigate(`/order/${order._id}/confirmation`, { replace: true });
    } catch (err) {
      toast.error("We could not place that order", err instanceof Error ? err.message : undefined);
    } finally {
      setPlacing(false);
    }
  };

  const totals = cart.quote?.totals;
  const deliveryComplete = Object.keys(deliveryIssues).length === 0;
  const paymentComplete = Object.keys(paymentIssues).length === 0;
  const stepsReady = [true, deliveryComplete, paymentComplete];

  return (
    <div className="container page checkout">
      <div className="checkout__head">
        <button type="button" className="link-plain" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} aria-hidden="true" /> Back
        </button>
        <h1>Checkout</h1>
        <p className="checkout__secure">
          <Lock size={13} aria-hidden="true" /> Demo payment — no real card is charged
        </p>
      </div>

      <ol className="stepper-steps" aria-label="Checkout progress">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={cx(
              index === step && "is-current",
              index < step && "is-done",
              stepsReady[index] && index < step && "is-valid"
            )}
          >
            <span className="stepper-steps__dot">
              {index < step ? <Check size={13} aria-hidden="true" /> : index + 1}
            </span>
            <span className="stepper-steps__label">{label}</span>
          </li>
        ))}
      </ol>

      <div className="checkout__layout">
        <div className="checkout__main">
          {step === 0 ? (
            <section className="checkout__panel">
              <h2>
                <MapPin size={18} aria-hidden="true" /> Delivery details
              </h2>

              {addresses.length > 0 ? (
                <div className="checkout__saved">
                  <p className="field__label">Use a saved address</p>
                  <div className="address-options">
                    {addresses.map((entry) => (
                      <label
                        key={entry._id}
                        className={cx("address-option", addressId === entry._id && "is-active")}
                      >
                        <input
                          type="radio"
                          name="address"
                          value={entry._id}
                          checked={addressId === entry._id}
                          onChange={() => {
                            setAddressId(entry._id);
                            setForm({
                              recipient: entry.recipient,
                              line1: entry.line1,
                              line2: entry.line2 || "",
                              city: entry.city,
                              state: entry.state,
                              zip: entry.zip,
                              phone: entry.phone || "",
                              instructions: entry.instructions || "",
                            });
                            setErrors({});
                          }}
                        />
                        <span>
                          <strong>
                            {entry.label} · {entry.recipient}
                          </strong>
                          <em>
                            {entry.line1}
                            {entry.line2 ? `, ${entry.line2}` : ""}, {entry.city}, {entry.state}{" "}
                            {entry.zip}
                          </em>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="form-grid">
                <label className="field">
                  <span className="field__label">Full name</span>
                  <input
                    value={form.recipient}
                    onChange={(event) => setForm({ ...form, recipient: event.target.value })}
                    autoComplete="name"
                  />
                  {errors.recipient ? <span className="field__error">{errors.recipient}</span> : null}
                </label>
                <label className="field">
                  <span className="field__label">Phone for the courier</span>
                  <input
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(555) 010-2030"
                  />
                  {errors.phone ? <span className="field__error">{errors.phone}</span> : null}
                </label>
                <label className="field field--wide">
                  <span className="field__label">Street address</span>
                  <input
                    value={form.line1}
                    onChange={(event) => setForm({ ...form, line1: event.target.value })}
                    placeholder="100 Campus Way, Apt 4B"
                    autoComplete="address-line1"
                  />
                  {errors.line1 ? <span className="field__error">{errors.line1}</span> : null}
                </label>
                <label className="field field--wide">
                  <span className="field__label">Apartment, suite (optional)</span>
                  <input
                    value={form.line2}
                    onChange={(event) => setForm({ ...form, line2: event.target.value })}
                    autoComplete="address-line2"
                  />
                </label>
                <label className="field">
                  <span className="field__label">City</span>
                  <input
                    value={form.city}
                    onChange={(event) => setForm({ ...form, city: event.target.value })}
                    autoComplete="address-level2"
                  />
                  {errors.city ? <span className="field__error">{errors.city}</span> : null}
                </label>
                <label className="field">
                  <span className="field__label">State</span>
                  <input
                    value={form.state}
                    onChange={(event) => setForm({ ...form, state: event.target.value })}
                    autoComplete="address-level1"
                  />
                  {errors.state ? <span className="field__error">{errors.state}</span> : null}
                </label>
                <label className="field">
                  <span className="field__label">ZIP code</span>
                  <input
                    value={form.zip}
                    onChange={(event) => setForm({ ...form, zip: event.target.value })}
                    inputMode="numeric"
                    autoComplete="postal-code"
                  />
                  {errors.zip ? <span className="field__error">{errors.zip}</span> : null}
                </label>
                <label className="field field--wide">
                  <span className="field__label">Delivery notes (optional)</span>
                  <input
                    value={form.instructions}
                    onChange={(event) => setForm({ ...form, instructions: event.target.value })}
                    placeholder="Buzzer broken — call when you arrive"
                  />
                </label>
              </div>

              <h3 className="checkout__subhead">How should we get it to you?</h3>
              <div className="method-options">
                <label className={cx("method-option", method === "Delivery" && "is-active")}>
                  <input
                    type="radio"
                    name="method"
                    checked={method === "Delivery"}
                    onChange={() => setMethod("Delivery")}
                  />
                  <Truck size={17} aria-hidden="true" />
                  <span>
                    <strong>Campus delivery</strong>
                    <em>Delivered to your address by a campus courier</em>
                  </span>
                </label>
                <label className={cx("method-option", method === "Pickup" && "is-active")}>
                  <input
                    type="radio"
                    name="method"
                    checked={method === "Pickup"}
                    onChange={() => setMethod("Pickup")}
                  />
                  <Store size={17} aria-hidden="true" />
                  <span>
                    <strong>Store pickup</strong>
                    <em>Collect from the seller — no delivery fee</em>
                  </span>
                </label>
              </div>

              <div className="checkout__actions">
                <Link to="/cart" className="btn btn--ghost">
                  Back to cart
                </Link>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => {
                    if (validateDelivery()) setStep(1);
                  }}
                >
                  Continue to payment
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </section>
          ) : null}

          {step === 1 ? (
            <section className="checkout__panel">
              <h2>
                <CreditCard size={18} aria-hidden="true" /> Demo payment
              </h2>
              <p className="checkout__callout">
                <Info size={15} aria-hidden="true" />
                This build simulates payment locally — nothing is sent to a payment provider and no
                card is charged. Use <strong>4242 4242 4242 4242</strong>, any future expiry and any
                CVC.
              </p>

              <div className="form-grid">
                <label className="field field--wide">
                  <span className="field__label">Card number</span>
                  <input
                    value={card.cardNumber}
                    onChange={(event) =>
                      setCard({
                        ...card,
                        cardNumber: event.target.value.replace(/[^\d\s]/g, "").slice(0, 23),
                      })
                    }
                    inputMode="numeric"
                    placeholder="4242 4242 4242 4242"
                    autoComplete="off"
                  />
                  {errors.cardNumber ? (
                    <span className="field__error">{errors.cardNumber}</span>
                  ) : null}
                </label>
                <label className="field">
                  <span className="field__label">Expiry</span>
                  <input
                    value={card.expiry}
                    onChange={(event) => setCard({ ...card, expiry: event.target.value.slice(0, 5) })}
                    placeholder="12/29"
                    inputMode="numeric"
                    autoComplete="off"
                  />
                  {errors.expiry ? <span className="field__error">{errors.expiry}</span> : null}
                </label>
                <label className="field">
                  <span className="field__label">Security code</span>
                  <input
                    value={card.cvc}
                    onChange={(event) =>
                      setCard({ ...card, cvc: event.target.value.replace(/\D/g, "").slice(0, 4) })
                    }
                    placeholder="123"
                    inputMode="numeric"
                    autoComplete="off"
                  />
                  {errors.cvc ? <span className="field__error">{errors.cvc}</span> : null}
                </label>
              </div>

              <div className="checkout__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setStep(0)}>
                  Back to delivery
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => {
                    if (validatePayment()) setStep(2);
                  }}
                >
                  Review order
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="checkout__panel">
              <h2>
                <BadgeCheck size={18} aria-hidden="true" /> Review and place your order
              </h2>

              <div className="review-blocks">
                <div className="review-block">
                  <header>
                    <h3>Deliver to</h3>
                    <button type="button" className="link-plain" onClick={() => setStep(0)}>
                      Edit
                    </button>
                  </header>
                  <p>
                    {form.recipient}
                    <br />
                    {form.line1}
                    {form.line2 ? `, ${form.line2}` : ""}
                    <br />
                    {form.city}, {form.state} {form.zip}
                  </p>
                  {form.phone ? <p className="review-block__muted">{form.phone}</p> : null}
                </div>

                <div className="review-block">
                  <header>
                    <h3>Payment</h3>
                    <button type="button" className="link-plain" onClick={() => setStep(1)}>
                      Edit
                    </button>
                  </header>
                  <p>
                    <Wallet size={14} aria-hidden="true" /> Demo card ending{" "}
                    {card.cardNumber.replace(/\D/g, "").slice(-4) || "4242"}
                  </p>
                  <p className="review-block__muted">Simulated payment — nothing is charged.</p>
                </div>

                <div className="review-block">
                  <header>
                    <h3>Method</h3>
                    <button type="button" className="link-plain" onClick={() => setStep(0)}>
                      Edit
                    </button>
                  </header>
                  <p>{method === "Pickup" ? "Store pickup" : "Campus delivery"}</p>
                </div>
              </div>

              <label className="field">
                <span className="field__label">Note for the seller (optional)</span>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Please call when you arrive — the gate is locked after 10pm"
                  maxLength={280}
                />
              </label>

              <div className="checkout__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setStep(1)}>
                  Back to payment
                </button>
                <button
                  type="button"
                  className="btn btn--accent btn--lg"
                  onClick={placeOrder}
                  disabled={placing}
                >
                  {placing ? <Spinner size={16} /> : <Lock size={16} aria-hidden="true" />}
                  {placing
                    ? "Placing your order…"
                    : `Place order · ${currency(totals?.total ?? cart.subtotal)}`}
                </button>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="checkout__summary">
          <h2>Your order</h2>
          {Object.entries(groups).map(([storeName, lines]) => (
            <div className="checkout__group" key={storeName}>
              <p className="checkout__group-name">
                <Store size={13} aria-hidden="true" /> {storeName}
              </p>
              <ul>
                {lines.map((line) => (
                  <li key={line.productId}>
                    <SmartImage
                      src={line.image}
                      alt={line.name}
                      ratio="square"
                      fallbackLabel={line.name}
                    />
                    <span>
                      <strong>
                        {line.name}
                        {line.quantity > 1 ? ` × ${line.quantity}` : ""}
                      </strong>
                      <em>{currency(line.price * line.quantity)}</em>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="cart-summary__rows">
            <div>
              <span>Subtotal</span>
              <span>{currency(totals?.subtotal ?? cart.subtotal)}</span>
            </div>
            <div>
              <span>Tax</span>
              <span>{totals ? currency(totals.tax) : "—"}</span>
            </div>
            <div>
              <span>Service fee</span>
              <span>{totals ? currency(totals.serviceFee) : "—"}</span>
            </div>
            <div>
              <span>{method === "Pickup" ? "Pickup" : "Delivery"}</span>
              <span>{totals ? currency(totals.deliveryFee) : "—"}</span>
            </div>
          </div>

          <div className="cart-summary__total">
            <span>Total</span>
            <strong>{totals ? currency(totals.total) : currency(cart.subtotal)}</strong>
          </div>

          <p className="checkout__summary-note">
            Delivering to <strong>{campusLabel}</strong>. You will get a notification at every status
            change.
          </p>
        </aside>
      </div>
    </div>
  );
}
