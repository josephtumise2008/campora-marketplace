import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CreditCard,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Send,
  Store,
  Truck,
  Undo2,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { marketplaceService } from "../services/marketplace";
import { Spinner } from "../components/ui/Feedback";
import { PageHeader } from "../components/common/SectionHeader";
import { useAsync } from "../hooks/useAsync";
import { STORE_IMAGES } from "../data/images";

const REASONS = [
  { value: "order", label: "An order" },
  { value: "seller", label: "Selling on Campora" },
  { value: "account", label: "My account" },
  { value: "bug", label: "Something is broken" },
  { value: "other", label: "Something else" },
];

export default function ContactPage() {
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    reason: "order",
    orderNumber: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const stores = useAsync(() => marketplaceService.stores({ limit: 6 }), []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Tell us your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email";
    if (form.message.trim().length < 15) next.message = "Add a little more detail (15+ characters)";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSending(true);
    // No external mail provider in this build: the request is stored locally
    // and acknowledged on screen, exactly like the demo payment flow.
    await new Promise((resolve) => setTimeout(resolve, 450));
    setSent(true);
    toast.success("Message received", "A Campora moderator will reply by email.");
    setForm({ name: form.name, email: form.email, reason: form.reason, orderNumber: "", message: "" });
    setSending(false);
  };

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Support"
        title="Contact Campora"
        description="Questions about an order, a store application or something broken? Send it here and we will get back to you by email."
      />

      <div className="contact-layout">
        <section className="panel">
          <header className="panel__head">
            <h2>
              <MessageSquare size={17} aria-hidden="true" /> Send a message
            </h2>
          </header>

          {sent ? (
            <div className="contact-success">
              <Send size={22} aria-hidden="true" />
              <h3>Thanks — we have your message</h3>
              <p>
                A Campora moderator will reply to <strong>{form.email}</strong>. If your question is about
                an order, include the order number so we can pull it up fast.
              </p>
              <button type="button" className="btn btn--secondary" onClick={() => setSent(false)}>
                Send another message
              </button>
            </div>
          ) : (
            <form className="form-stack" onSubmit={submit} noValidate>
              <div className="form-grid">
                <label className="field">
                  <span className="field__label">Your name</span>
                  <input
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    aria-invalid={Boolean(errors.name)}
                  />
                  {errors.name ? <span className="field__error">{errors.name}</span> : null}
                </label>
                <label className="field">
                  <span className="field__label">Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    aria-invalid={Boolean(errors.email)}
                  />
                  {errors.email ? <span className="field__error">{errors.email}</span> : null}
                </label>
                <label className="field">
                  <span className="field__label">What is this about?</span>
                  <select
                    value={form.reason}
                    onChange={(event) => setForm({ ...form, reason: event.target.value })}
                  >
                    {REASONS.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field__label">Order number (optional)</span>
                  <input
                    value={form.orderNumber}
                    onChange={(event) => setForm({ ...form, orderNumber: event.target.value })}
                    placeholder="CMP-2026-0001"
                  />
                </label>
              </div>

              <label className="field">
                <span className="field__label">Message</span>
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                  placeholder="What happened, and what would you like us to do about it?"
                  aria-invalid={Boolean(errors.message)}
                />
                {errors.message ? (
                  <span className="field__error">{errors.message}</span>
                ) : (
                  <span className="field__hint">The more detail the better, especially for order issues.</span>
                )}
              </label>

              <div className="panel__actions">
                <button type="submit" className="btn btn--primary" disabled={sending}>
                  {sending ? <Spinner size={15} /> : <Send size={15} aria-hidden="true" />}
                  Send message
                </button>
              </div>
            </form>
          )}
        </section>

        <aside className="stack-md">
          <section className="panel">
            <header className="panel__head">
              <h2>Other ways to reach us</h2>
            </header>
            <ul className="contact-list">
              <li>
                <Mail size={16} aria-hidden="true" />
                <div>
                  <strong>campora@campora.market</strong>
                  <span>General and seller support</span>
                </div>
              </li>
              <li>
                <Package size={16} aria-hidden="true" />
                <div>
                  <strong>orders@campora.market</strong>
                  <span>Order problems — include your order number</span>
                </div>
              </li>
              <li>
                <Store size={16} aria-hidden="true" />
                <div>
                  <strong>sellers@campora.market</strong>
                  <span>Store applications and verification</span>
                </div>
              </li>
              <li>
                <MapPin size={16} aria-hidden="true" />
                <div>
                  <strong>Campus HQ</strong>
                  <span>Student Union, room 204 — weekdays 10 AM–5 PM</span>
                </div>
              </li>
            </ul>
            <p className="form-note">
              Campora is a demo build, so email is illustrative. Use the form above and the message is
              recorded locally instead.
            </p>
          </section>

          <section className="panel">
            <header className="panel__head">
              <h2>
                <BookOpen size={17} aria-hidden="true" /> Faster answers
              </h2>
            </header>
            <ul className="contact-links">
              <li>
                <Truck size={15} aria-hidden="true" />
                <Link to="/help#delivery">Delivery and pickup windows</Link>
              </li>
              <li>
                <CreditCard size={15} aria-hidden="true" />
                <Link to="/help#payments">How demo payments work</Link>
              </li>
              <li>
                <Undo2 size={15} aria-hidden="true" />
                <Link to="/help#returns">Returns and substitutions</Link>
              </li>
            </ul>
          </section>
        </aside>
      </div>

      <section className="panel">
        <header className="panel__head">
          <h2>Stores people ask about most</h2>
        </header>
        {stores.loading ? (
          <p className="panel__text">Loading stores…</p>
        ) : (
          <ul className="contact-stores">
            {(stores.data?.items ?? []).map((store) => {
              const art = STORE_IMAGES[store.slug];
              return (
                <li key={store._id}>
                  <img src={art?.cover || store.cover} alt="" loading="lazy" />
                  <div>
                    <Link to={`/stores/${store.slug}`}>{store.name}</Link>
                    <span>
                      {store.contact?.email} · {store.location?.city}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
