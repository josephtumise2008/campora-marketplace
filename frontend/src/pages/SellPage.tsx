import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  Clock3,
  Package,
  Percent,
  Store,
  Upload,
  Wallet,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useUniversity } from "../context/UniversityContext";
import { sellerService } from "../services/marketplace";
import { cx, currency, etaLabel } from "../utils/format";
import { CATEGORY_IMAGES, HERO_IMAGES, STORE_IMAGES } from "../data/images";
import { SmartImage } from "../components/ui/SmartImage";
import { Spinner } from "../components/ui/Feedback";

const STEPS = [
  { icon: Store, title: "Apply", text: "Tell us about your business in about three minutes." },
  { icon: BadgeCheck, title: "Get verified", text: "We review your application and approve the store." },
  { icon: Package, title: "List products", text: "Add your catalogue with photos, prices and stock." },
  { icon: BarChart3, title: "Track sales", text: "Watch revenue, orders and customers in your dashboard." },
];

const BENEFITS = [
  { icon: Wallet, title: "Keep 92%", text: "An 8% marketplace fee. No subscription, no listing fees." },
  { icon: Clock3, title: "Your hours", text: "Open when it suits you and pause during exam season." },
  { icon: Percent, title: "Your own promos", text: "Set promo codes and mark your own products on sale." },
  { icon: BarChart3, title: "Real numbers", text: "Revenue, best sellers, repeat customers and low stock." },
];

interface FormState {
  businessName: string;
  tagline: string;
  description: string;
  category: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  etaMinutes: string;
  deliveryMethods: string[];
  university: string;
  password: string;
  name: string;
  email: string;
}

export default function SellPage() {
  const { user, isAuthenticated, register, refresh } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { universities, university } = useUniversity();

  const [form, setForm] = useState<FormState>({
    businessName: "",
    tagline: "",
    description: "",
    category: "food",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    etaMinutes: "40",
    deliveryMethods: ["Delivery"],
    university: university?.code || "",
    password: "",
    name: "",
    email: "",
  });
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update =
    (key: keyof FormState) =>
    (event: { target: { value: string } }) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  const toggleMethod = (method: string) =>
    setForm((current) => ({
      ...current,
      deliveryMethods: current.deliveryMethods.includes(method)
        ? current.deliveryMethods.filter((entry) => entry !== method)
        : [...current.deliveryMethods, method],
    }));

  const existingSeller =
    isAuthenticated && user?.store
      ? user.store
      : null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.businessName.trim()) {
      setError("Give your store a name");
      return;
    }
    if (!form.tagline.trim()) {
      setError("Add a short tagline — it shows under your store name");
      return;
    }

    if (isAuthenticated && user?.store) {
      toast.info("You already run a store", "Open your dashboard to manage products and orders.");
      navigate("/seller");
      return;
    }

    if (!isAuthenticated && form.password.length < 8) {
      setError("Choose a password with at least 8 characters");
      return;
    }
    if (!isAuthenticated && (!form.name.trim() || !form.email.trim())) {
      setError("Add your name and email so we can contact you");
      return;
    }

    const application = {
      businessName: form.businessName.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      category: form.category,
      address: form.address.trim(),
      city: form.city.trim() || university?.city || "",
      state: form.state.trim() || university?.state || "",
      zip: form.zip.trim(),
      phone: form.phone.trim(),
      etaMinutes: Number(form.etaMinutes) || 40,
      deliveryMethods: form.deliveryMethods,
      university: form.university,
      logo: STORE_IMAGES["campus-grocery-co"].logo,
      cover: STORE_IMAGES["campus-grocery-co"].cover,
    };

    setBusy(true);
    try {
      if (isAuthenticated) {
        await sellerService.applyForStore(application);
        await refresh();
        toast.success("Application received", "We will review your store and notify you shortly.");
        navigate("/seller");
        return;
      }

      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        role: "seller",
        university: form.university,
        storeApplication: application,
      });
      toast.success("Application received", "We will review your store and notify you shortly.");
      navigate("/seller");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not submit your application");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sell">
      <section className="sell__hero">
        <div className="container sell__hero-inner">
          <motion.div
            className="sell__hero-copy"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="hero__pill">
              <Store size={14} aria-hidden="true" /> Seller applications open
            </p>
            <h1>Turn your campus into customers</h1>
            <p>
              Campora puts your products in front of students on your campus who are already looking
              for them. Keep 92% of every order and set your own hours.
            </p>
            <div className="sell__hero-actions">
              <a href="#apply" className="btn btn--accent btn--lg">
                Apply to sell
                <ArrowRight size={17} aria-hidden="true" />
              </a>
              <a href="#how-it-works" className="btn btn--outline btn--lg">
                How it works
              </a>
            </div>
            <ul className="sell__hero-stats">
              <li>
                <strong>9</strong> live campus stores
              </li>
              <li>
                <strong>99</strong> products listed
              </li>
              <li>
                <strong>4.8★</strong> average rating
              </li>
            </ul>
          </motion.div>

          <motion.div
            className="sell__hero-visual"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <div className="sell__preview">
              <header className="sell__preview-head">
                <span className="sell__preview-logo">
                  <SmartImage
                    src={STORE_IMAGES["green-bowl"].cover}
                    alt="Seller storefront preview"
                    ratio="wide"
                    fallbackLabel="Your store"
                  />
                </span>
                <div>
                  <strong>Your store name</strong>
                  <em>Verified campus seller</em>
                </div>
              </header>
              <ul className="sell__preview-stats">
                <li>
                  <strong>$2,481</strong>
                  <em>Revenue this month</em>
                </li>
                <li>
                  <strong>64</strong>
                  <em>Orders</em>
                </li>
                <li>
                  <strong>4.9</strong>
                  <em>Rating</em>
                </li>
              </ul>
              <div className="sell__preview-chart" aria-hidden="true">
                {[38, 52, 44, 68, 60, 82, 74, 96].map((height, index) => (
                  <span key={index} style={{ height: `${height}%` }} />
                ))}
              </div>
              <p className="sell__preview-foot">
                <Check size={14} aria-hidden="true" /> Live order updates keep students confident
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="container">
          <header className="section-header section-header--center">
            <p className="eyebrow">How it works</p>
            <h2 className="section-title">Four steps from application to first sale</h2>
          </header>
          <ol className="steps-grid">
            {STEPS.map((entry, index) => (
              <li key={entry.title}>
                <span className="steps-grid__number">{index + 1}</span>
                <span className="steps-grid__icon">
                  <entry.icon size={20} aria-hidden="true" />
                </span>
                <h3>{entry.title}</h3>
                <p>{entry.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--alt" id="fees">
        <div className="container sell__fees">
          <div>
            <p className="eyebrow">Fees</p>
            <h2 className="section-title">Simple, honest pricing</h2>
            <p className="section-description">
              Campora charges a single marketplace fee per order. There is no monthly subscription, no
              listing fee and no penalty for pausing your store.
            </p>
            <ul className="sell__fee-list">
              <li>
                <span className="sell__fee-value">8%</span>
                <span>
                  <strong>Marketplace fee</strong>
                  <em>Deducted automatically when an order is delivered</em>
                </span>
              </li>
              <li>
                <span className="sell__fee-value">$0</span>
                <span>
                  <strong>To set up</strong>
                  <em>No cost to apply, list your first product or go live</em>
                </span>
              </li>
              <li>
                <span className="sell__fee-value">You</span>
                <span>
                  <strong>Set your delivery fee</strong>
                  <em>Typical campus stores charge {currency(2.99)} or offer free over $35</em>
                </span>
              </li>
            </ul>
            <p className="sell__fees-note">
              Average delivery time across Campora stores is {etaLabel(40)}. Sellers who keep their
              stock updated get more repeat orders.
            </p>
          </div>

          <ul className="sell__benefits">
            {BENEFITS.map((benefit) => (
              <li key={benefit.title}>
                <span className="sell__benefit-icon">
                  <benefit.icon size={18} aria-hidden="true" />
                </span>
                <span>
                  <strong>{benefit.title}</strong>
                  <em>{benefit.text}</em>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" id="apply">
        <div className="container sell__apply">
          {existingSeller ? (
            <div className="sell__apply-existing">
              <BadgeCheck size={26} aria-hidden="true" />
              <h2>You already run a Campora store</h2>
              <p>
                Open your dashboard to add products, update your hours and manage incoming orders.
              </p>
              <Link to="/seller" className="btn btn--primary btn--lg">
                Go to seller dashboard
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <form className="sell__form" onSubmit={submit}>
              <header className="sell__form-head">
                <div>
                  <p className="eyebrow">Seller application</p>
                  <h2>Apply to sell on Campora</h2>
                  <p>
                    Applications are reviewed by the Campora team. In this local build your store is
                    created instantly so you can explore the seller dashboard.
                  </p>
                </div>
                <ol className="sell__form-steps" aria-label="Application progress">
                  {["Your store", "Where you sell", "Your account"].map((label, index) => (
                    <li key={label} className={cx(index <= step && "is-active")}>
                      <span>{index + 1}</span>
                      {label}
                    </li>
                  ))}
                </ol>
              </header>

              {error ? (
                <p className="form-alert" role="alert">
                  {error}
                </p>
              ) : null}

              {step === 0 ? (
                <fieldset className="sell__fieldset">
                  <legend>Your store</legend>
                  <div className="form-grid">
                    <label className="field">
                      <span className="field__label">Store name</span>
                      <input
                        required
                        value={form.businessName}
                        onChange={update("businessName")}
                        placeholder="The Campus Bakery"
                      />
                    </label>
                    <label className="field">
                      <span className="field__label">Category</span>
                      <select value={form.category} onChange={update("category")}>
                        <option value="food">Food & drinks</option>
                        <option value="groceries">Groceries & essentials</option>
                        <option value="fashion">Fashion</option>
                        <option value="electronics">Electronics</option>
                        <option value="school">School supplies</option>
                        <option value="dorm">Dorm & living</option>
                        <option value="beauty">Beauty & care</option>
                        <option value="fitness">Fitness</option>
                        <option value="gaming">Gaming</option>
                        <option value="gifts">Gifts</option>
                        <option value="services">Services</option>
                      </select>
                    </label>
                    <label className="field field--wide">
                      <span className="field__label">Tagline</span>
                      <input
                        required
                        value={form.tagline}
                        onChange={update("tagline")}
                        placeholder="Fresh bakes delivered to your dorm"
                        maxLength={70}
                      />
                      <span className="field__hint">Shown under your store name everywhere on Campora.</span>
                    </label>
                    <label className="field field--wide">
                      <span className="field__label">About your store</span>
                      <textarea
                        rows={4}
                        value={form.description}
                        onChange={update("description")}
                        placeholder="What do you sell, when are you open, and what makes you different?"
                        maxLength={400}
                      />
                    </label>
                    <div className="field field--wide">
                      <span className="field__label">Store artwork</span>
                      <div className="sell__artwork">
                        {[
                          { key: "groceries" as const, label: "Groceries" },
                          { key: "food" as const, label: "Food" },
                          { key: "dorm" as const, label: "Dorm" },
                          { key: "fashion" as const, label: "Fashion" },
                        ].map((option) => (
                          <span key={option.key} className="sell__artwork-item">
                            <SmartImage
                              src={CATEGORY_IMAGES[option.key]}
                              alt={option.label}
                              ratio="square"
                              fallbackLabel={option.label}
                            />
                            <em>{option.label}</em>
                          </span>
                        ))}
                      </div>
                      <span className="field__hint">
                        <Upload size={13} aria-hidden="true" /> Uploads are disabled in this demo — we
                        pick a storefront image for you.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => {
                      if (!form.businessName.trim() || !form.tagline.trim()) {
                        setError("Add a store name and tagline to continue");
                        return;
                      }
                      setError(null);
                      setStep(1);
                    }}
                  >
                    Continue
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </fieldset>
              ) : null}

              {step === 1 ? (
                <fieldset className="sell__fieldset">
                  <legend>Where you sell</legend>
                  <div className="form-grid">
                    <label className="field field--wide">
                      <span className="field__label">Campus</span>
                      <select value={form.university} onChange={update("university")} required>
                        <option value="">Select your campus</option>
                        {universities.map((entry) => (
                          <option key={entry.code} value={entry.code}>
                            {entry.name} — {entry.city}, {entry.state}
                          </option>
                        ))}
                        <option value="other">Other / not listed</option>
                      </select>
                    </label>
                    <label className="field field--wide">
                      <span className="field__label">Business address</span>
                      <input
                        value={form.address}
                        onChange={update("address")}
                        placeholder="12 Student Union Plaza"
                      />
                    </label>
                    <label className="field">
                      <span className="field__label">City</span>
                      <input
                        value={form.city}
                        onChange={update("city")}
                        placeholder={university?.city || "Los Angeles"}
                      />
                    </label>
                    <label className="field">
                      <span className="field__label">State</span>
                      <input
                        value={form.state}
                        onChange={update("state")}
                        placeholder={university?.state || "CA"}
                      />
                    </label>
                    <label className="field">
                      <span className="field__label">ZIP</span>
                      <input value={form.zip} onChange={update("zip")} placeholder="90095" />
                    </label>
                    <label className="field">
                      <span className="field__label">Typical delivery time (minutes)</span>
                      <input
                        type="number"
                        min={10}
                        step={5}
                        value={form.etaMinutes}
                        onChange={update("etaMinutes")}
                      />
                    </label>
                    <div className="field field--wide">
                      <span className="field__label">How you fulfil orders</span>
                      <div className="method-options">
                        {["Delivery", "Pickup"].map((method) => (
                          <label
                            key={method}
                            className={cx(
                              "method-option",
                              form.deliveryMethods.includes(method) && "is-active"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={form.deliveryMethods.includes(method)}
                              onChange={() => toggleMethod(method)}
                            />
                            <span>
                              <strong>{method}</strong>
                              <em>
                                {method === "Delivery"
                                  ? "A courier brings orders to the customer"
                                  : "Students collect from your store"}
                              </em>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="sell__fieldset-actions">
                    <button type="button" className="btn btn--ghost" onClick={() => setStep(0)}>
                      Back
                    </button>
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => {
                        if (!form.university) {
                          setError("Choose the campus you sell on");
                          return;
                        }
                        setError(null);
                        setStep(2);
                      }}
                    >
                      Continue
                      <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  </div>
                </fieldset>
              ) : null}

              {step === 2 ? (
                <fieldset className="sell__fieldset">
                  <legend>Your seller account</legend>
                  {isAuthenticated ? (
                    <p className="form-note">
                      You are signed in as {user?.name}. Submitting will take you to the seller
                      dashboard.
                    </p>
                  ) : (
                    <div className="form-grid">
                      <label className="field">
                        <span className="field__label">Your name</span>
                        <input required value={form.name} onChange={update("name")} autoComplete="name" />
                      </label>
                      <label className="field">
                        <span className="field__label">Email</span>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={update("email")}
                          autoComplete="email"
                        />
                      </label>
                      <label className="field field--wide">
                        <span className="field__label">Password</span>
                        <input
                          type="password"
                          required
                          value={form.password}
                          onChange={update("password")}
                          placeholder="At least 8 characters"
                          autoComplete="new-password"
                        />
                      </label>
                    </div>
                  )}

                  <div className="sell__fieldset-actions">
                    <button type="button" className="btn btn--ghost" onClick={() => setStep(1)}>
                      Back
                    </button>
                    <button type="submit" className="btn btn--accent btn--lg" disabled={busy}>
                      {busy ? <Spinner size={16} /> : <Store size={17} aria-hidden="true" />}
                      {busy ? "Submitting…" : "Submit application"}
                    </button>
                  </div>
                </fieldset>
              ) : null}
            </form>
          )}
        </div>
      </section>

      <section className="sell__bottom">
        <div className="container sell__bottom-inner">
          <SmartImage
            src={HERO_IMAGES.lifestyle}
            alt="Campus life"
            ratio="wide"
            fallbackLabel="Campus life"
          />
          <div>
            <h2>Questions before you apply?</h2>
            <p>
              The seller guide explains fees, fulfilment, order statuses and how to get your store
              approved.
            </p>
            <Link to="/help#sellers" className="btn btn--secondary">
              Read the seller guide
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
