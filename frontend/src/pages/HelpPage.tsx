import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  CreditCard,
  LifeBuoy,
  MapPin,
  MessageSquare,
  Search,
  Store,
  Truck,
  Undo2,
  User,
} from "lucide-react";

const TOPICS = [
  {
    id: "orders",
    icon: Truck,
    title: "Orders & delivery",
    blurb: "Order tracking, delivery windows, pickup and late deliveries.",
    items: [
      {
        q: "How long does delivery take on my campus?",
        a: "Each store sets its own estimate, usually 25–60 minutes on campus. You will see the exact window on the store page and again at checkout. Stores that offer pickup show a ready-for-pickup status instead.",
      },
      {
        q: "My order says Out for Delivery but nothing arrived.",
        a: "Give the courier about 15 minutes, then contact the store directly from your order page. If the order is more than an hour past its window, our support team can step in and mark it Delivered or issue a refund.",
      },
      {
        q: "Can I change or cancel an order?",
        a: "Yes, while the status is Pending. Open the order in your account and choose Cancel. After a store confirms the order, contact the store directly — items may already be prepared.",
      },
      {
        q: "Do you deliver to my dorm or only my address?",
        a: "Stores deliver to the address on your order, including dorm rooms and apartment units. Add the building, room and any buzzer instructions in your saved addresses so couriers can find you.",
      },
    ],
  },
  {
    id: "payments",
    icon: CreditCard,
    title: "Payments",
    blurb: "Demo cards, receipts, fees and refunds.",
    items: [
      {
        q: "Is my card actually charged?",
        a: "No. Campora simulates payments end to end so the whole flow is testable without touching a real gateway. Use 4242 4242 4242 4242 with any future expiry and any 3-digit CVC. Cards that fail Luhn validation are rejected on purpose.",
      },
      {
        q: "What does the service fee cover?",
        a: "The service fee funds campus operations — verification, moderation and support. Delivery fees are set by each store, and many stores offer free delivery above a threshold you choose.",
      },
      {
        q: "How do refunds work?",
        a: "Refunds return to the original demo card and appear as a refunded status on the order. Store refunds usually land within a few days, matching the store's stated policy.",
      },
    ],
  },
  {
    id: "returns",
    icon: Undo2,
    title: "Returns & substitutions",
    blurb: "Store policies, damaged items and missing items.",
    items: [
      {
        q: "What is the return policy?",
        a: "Each store publishes its own returns and substitutions policy on its store page, and that policy is what applies. Most stores accept unopened items within 7 days.",
      },
      {
        q: "My item arrived damaged.",
        a: "Take a photo, open the order in your account and contact the store the same day. Damaged items are almost always refunded or replaced at the store's discretion.",
      },
      {
        q: "My order is missing an item.",
        a: "Message the store with your order number. If the item was marked out of stock, the difference is refunded automatically at checkout pricing.",
      },
    ],
  },
  {
    id: "selling",
    icon: Store,
    title: "Selling on Campora",
    blurb: "Applications, verification, payouts and catalogue rules.",
    items: [
      {
        q: "How do I open a store?",
        a: "Apply from the Sell page with your business name, campus and contact details. A Campora admin reviews the application, and once approved your store gets a verified badge and appears in campus search.",
      },
      {
        q: "How long does verification take?",
        a: "Usually within one business day. You can build your catalogue while you wait — products stay hidden from shoppers until the store is verified.",
      },
      {
        q: "How do sellers get paid?",
        a: "Payments are simulated in this build, so there is no payout rail. Store revenue, order value and platform fees all appear in your seller dashboard for realistic reporting.",
      },
      {
        q: "What can I not sell?",
        a: "No alcohol, tobacco, prescription medication, weapons or anything that violates your campus's policies. Student ID may be required for age-restricted items.",
      },
    ],
  },
  {
    id: "account",
    icon: User,
    title: "Your account",
    blurb: "Campuses, addresses, saved items and privacy.",
    items: [
      {
        q: "Can I shop for more than one campus?",
        a: "Yes. Switch your campus in the header at any time. Products and stores are filtered to the campuses that store delivers to.",
      },
      {
        q: "Where is my cart stored?",
        a: "On your device, and it survives a refresh. Sign in to keep your saved items, addresses and order history attached to your account.",
      },
      {
        q: "Who can see my order?",
        a: "The store fulfilling your order sees the items and the delivery address needed to complete it. Other stores and other students cannot see your orders.",
      },
      {
        q: "How do I delete my data?",
        a: "Email privacy@campora.market from the address on your account. We remove your orders, addresses and saved items within 30 days.",
      },
    ],
  },
];

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(TOPICS[0].items[0].q);

  const term = query.trim().toLowerCase();
  const filtered = TOPICS.map((topic) => ({
    ...topic,
    items: topic.items.filter(
      (entry) =>
        !term ||
        entry.q.toLowerCase().includes(term) ||
        entry.a.toLowerCase().includes(term) ||
        topic.title.toLowerCase().includes(term)
    ),
  })).filter((topic) => topic.items.length > 0);

  const results = filtered.reduce((sum, topic) => sum + topic.items.length, 0);

  return (
    <div className="stack-lg">
      <header className="page-hero page-hero--compact">
        <div className="page-hero__body">
          <p className="eyebrow">Help centre</p>
          <h1>How can we help?</h1>
          <p className="page-hero__lede">
            Answers about orders, payments, selling and your account. Still stuck?{" "}
            <Link to="/contact" className="link-arrow">
              Contact support
            </Link>
            .
          </p>
          <label className="field field--search field--block page-hero__search">
            <span className="sr-only">Search help articles</span>
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={query}
              placeholder="Search “refund”, “delivery”, “verification”…"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
      </header>

      {term && results === 0 ? (
        <div className="panel">
          <div className="empty-state">
            <span className="empty-state__icon">
              <Search size={24} aria-hidden="true" />
            </span>
            <h2>No articles match “{query}”</h2>
            <p>Try a shorter phrase, or ask us directly and we will answer within a business day.</p>
            <Link to="/contact" className="btn btn--primary">
              <MessageSquare size={16} aria-hidden="true" />
              Contact support
            </Link>
          </div>
        </div>
      ) : null}

      <nav className="help-nav" aria-label="Help topics">
        {TOPICS.map((topic) => (
          <a key={topic.id} href={`#${topic.id}`}>
            <topic.icon size={15} aria-hidden="true" />
            {topic.title}
          </a>
        ))}
      </nav>

      {filtered.map((topic) => (
        <section key={topic.id} id={topic.id} className="help-section">
          <header className="help-section__head">
            <span className="help-section__icon">
              <topic.icon size={18} aria-hidden="true" />
            </span>
            <div>
              <h2>{topic.title}</h2>
              <p>{topic.blurb}</p>
            </div>
          </header>

          <ul className="faq-list">
            {topic.items.map((entry) => {
              const isOpen = open === entry.q;
              return (
                <li key={entry.q} className="faq">
                  <button
                    type="button"
                    className="faq__question"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : entry.q)}
                  >
                    {entry.q}
                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className={isOpen ? "faq__chevron is-open" : "faq__chevron"}
                    />
                  </button>
                  {isOpen ? <p className="faq__answer">{entry.a}</p> : null}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section className="callout-band">
        <LifeBuoy size={26} aria-hidden="true" />
        <div>
          <h2>Still need a human?</h2>
          <p>
            Support replies to order issues within a few hours during campus hours, and always within one
            business day.
          </p>
        </div>
        <Link to="/contact" className="btn btn--primary">
          <MessageSquare size={16} aria-hidden="true" />
          Contact support
        </Link>
      </section>

      <section className="panel panel--muted">
        <h2>Quick links</h2>
        <ul className="contact-links">
          <li>
            <MapPin size={15} aria-hidden="true" />
            <Link to="/account/addresses">Manage delivery addresses</Link>
          </li>
          <li>
            <Truck size={15} aria-hidden="true" />
            <Link to="/account/orders">Track an order</Link>
          </li>
          <li>
            <Store size={15} aria-hidden="true" />
            <Link to="/stores">Browse campus stores</Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
