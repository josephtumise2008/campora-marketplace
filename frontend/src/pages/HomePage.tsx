import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  Clock3,
  CreditCard,
  Headphones,
  Leaf,
  Sparkles,
  Store,
} from "lucide-react";
import { useUniversity } from "../context/UniversityContext";
import { useAuth } from "../context/AuthContext";
import { numberCompact } from "../utils/format";
import { SearchBar } from "../components/common/SearchBar";
import { HeroCarousel } from "../components/common/HeroCarousel";
import { TrustStrip } from "../components/common/SectionHeader";

function Hero({ campusLabel }: { campusLabel: string }) {
  const { isAuthenticated, user } = useAuth();

  return (
    <section className="hero">
      <div className="container hero__inner">
        <motion.div
          className="hero__copy"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="hero__pill">
            <Sparkles size={14} aria-hidden="true" />
            {numberCompact(9)} campus stores · same-day delivery
          </p>
          <h1 className="hero__title">
            Your campus,
            <br />
            <span className="hero__title-accent">one marketplace.</span>
          </h1>
          <p className="hero__text">
            Groceries, meals, textbooks, tech, dorm essentials and student-made services — from
            verified sellers who deliver to <strong>{campusLabel}</strong> and beyond.
          </p>

          <div className="hero__search">
            <SearchBar variant="hero" />
          </div>

          <div className="hero__actions">
            <Link to="/explore" className="btn btn--primary btn--lg">
              Start shopping
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link to="/sell" className="btn btn--outline btn--lg">
              <Store size={17} aria-hidden="true" />
              Sell on Campora
            </Link>
          </div>

          <p className="hero__meta">
            {isAuthenticated ? (
              <>
                Signed in as <strong>{user?.name}</strong> ·{" "}
                <Link to="/account/orders">track your orders</Link>
              </>
            ) : (
              <>
                New here? <Link to="/register">Create a free account</Link> — it takes under a minute.
              </>
            )}
          </p>
        </motion.div>

        <motion.div
          className="hero__visual"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeroCarousel />

          <div className="hero__float hero__float--delivery">
            <span className="hero__float-icon">
              <Bike size={17} aria-hidden="true" />
            </span>
            <span>
              <strong>On the way</strong>
              <em>Order #CMP-20481 · 18 min</em>
            </span>
          </div>
          <div className="hero__float hero__float--rating">
            <span className="hero__float-icon hero__float-icon--warm">
              <BadgeCheck size={17} aria-hidden="true" />
            </span>
            <span>
              <strong>4.8 average</strong>
              <em>across 89 verified reviews</em>
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { university, campusLabel } = useUniversity();
  const label = university?.name || campusLabel || "your campus";

  return (
    <div className="stack-lg">
      <Hero campusLabel={label} />
      <TrustStrip items={TRUST_ITEMS} />
    </div>
  );
}

const TRUST_ITEMS = [
  { icon: <Clock3 size={18} aria-hidden="true" />, title: "Open late", text: "Orders after the library closes." },
  { icon: <CreditCard size={18} aria-hidden="true" />, title: "Simple checkout", text: "Demo payment to test the flow." },
  { icon: <Headphones size={18} aria-hidden="true" />, title: "Human support", text: "Real responses to order issues." },
  { icon: <Leaf size={18} aria-hidden="true" />, title: "Less waste", text: "Group orders reduce trips." },
];
