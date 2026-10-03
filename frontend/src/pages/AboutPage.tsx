import { Link } from "react-router-dom";
import { ArrowRight, Bike, GraduationCap, Heart, Store, Truck, Users } from "lucide-react";
import { HERO_IMAGES } from "../data/images";

const PILLARS = [
  {
    icon: Store,
    title: "Student-run stores",
    body: "Campus grocers, campus print shops, resellers and student entrepreneurs list what they actually have in stock.",
  },
  {
    icon: Truck,
    title: "Delivery that fits a class schedule",
    body: "Pick a delivery window that works between lectures. Free delivery thresholds are set by each store, not by us.",
  },
  {
    icon: Heart,
    title: "Saved lists and honest reviews",
    body: "Only verified buyers can review a product, so the rating reflects real campus orders instead of hype.",
  },
  {
    icon: Users,
    title: "One account across campus",
    body: "Switch your campus any time and your cart, addresses and saved items follow you.",
  },
];

const STEPS = [
  { step: "01", title: "Pick your campus", body: "Choose your university so you only see stores that actually deliver to you." },
  { step: "02", title: "Add to cart", body: "Browse by category, store or deal, and save anything you want to think about." },
  { step: "03", title: "Check out with a demo card", body: "Payment is simulated end to end — no real card, no gateway, nothing to leak." },
  { step: "04", title: "Track it in your account", body: "Every status change from seller to delivered shows up in your order timeline." },
];

export default function AboutPage() {
  return (
    <div className="stack-lg">
      <section className="page-hero page-hero--about">
        <div className="page-hero__body">
          <p className="eyebrow">About Campora</p>
          <h1>The campus marketplace built by students, for students</h1>
          <p className="page-hero__lede">
            Campora connects the shops, sellers and students who already trade on campus — without the
            fees, mystery markups and dead listings of a big delivery app.
          </p>
          <div className="page-hero__actions">
            <Link to="/explore" className="btn btn--primary">
              Explore the marketplace
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link to="/sell" className="btn btn--ghost">
              <Store size={16} aria-hidden="true" />
              Sell on Campora
            </Link>
          </div>
        </div>
        <div className="page-hero__art" aria-hidden="true">
          <img src={HERO_IMAGES.shopping} alt="" />
        </div>
      </section>

      <section className="stat-strip">
        <div>
          <strong>9</strong>
          <span>campus stores live</span>
        </div>
        <div>
          <strong>99</strong>
          <span>products listed</span>
        </div>
        <div>
          <strong>4.8★</strong>
          <span>average store rating</span>
        </div>
        <div>
          <strong>8</strong>
          <span>campuses supported</span>
        </div>
      </section>

      <section className="prose-section">
        <h2>Why Campora exists</h2>
        <p>
          Campus commerce happens in group chats, spreadsheets and the five minutes between classes. Those
          systems work, but they break the moment a store runs out of stock, a delivery is late, or a
          payment goes sideways. Campora turns that informal trade into something reliable: real stock
          counts, clear delivery windows, order timelines and reviews from people who actually bought the
          thing.
        </p>
        <p>
          Every seller here is a small operation — a student club, a campus kitchen, a reselling
          business. They set their own prices, their own delivery fees and their own hours. We just make
          sure the marketplace around them is fast, honest and usable on a phone between lectures.
        </p>
      </section>

      <section className="feature-grid">
        {PILLARS.map((pillar) => (
          <article key={pillar.title} className="feature-card">
            <span className="feature-card__icon">
              <pillar.icon size={20} aria-hidden="true" />
            </span>
            <h3>{pillar.title}</h3>
            <p>{pillar.body}</p>
          </article>
        ))}
      </section>

      <section className="prose-section">
        <h2>How it works</h2>
        <ol className="step-cards">
          {STEPS.map((entry) => (
            <li key={entry.step}>
              <span className="step-cards__number">{entry.step}</span>
              <h3>{entry.title}</h3>
              <p>{entry.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="callout-band">
        <Bike size={26} aria-hidden="true" />
        <div>
          <h2>Built for the ten minutes you actually have</h2>
          <p>
            Search suggestions, saved carts, one-tap reorder from your order history and pickup options for
            when delivery would make you late.
          </p>
        </div>
        <Link to="/explore" className="btn btn--primary">
          Start exploring
        </Link>
      </section>

      <section className="prose-section">
        <h2>For universities</h2>
        <p>
          Campora is built to be deployed per campus. Universities, student unions and campus operations
          teams can run their own marketplace with their own store approvals, policies and delivery
          windows — all self-hosted, with no external payment or mapping dependency.
        </p>
        <p>
          <GraduationCap size={15} aria-hidden="true" /> Supported campuses: UCLA, USC, UT Austin,
          Michigan, NYU, Florida, Ohio State and UW, plus an "Other" option for everything else.
        </p>
      </section>
    </div>
  );
}
