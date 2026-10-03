import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgeCheck, Bike, GraduationCap, ShieldCheck, Store, Truck } from "lucide-react";
import { HERO_IMAGES } from "../data/images";
import { SmartImage } from "../components/ui/SmartImage";
import { useUniversity } from "../context/UniversityContext";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

const POINTS = [
  { icon: Truck, title: "Free delivery over $35", text: "Per store, straight to your dorm." },
  { icon: BadgeCheck, title: "Verified campus sellers", text: "Reviewed before they can list anything." },
  { icon: Bike, title: "Live order tracking", text: "Know where your order is at every step." },
  { icon: ShieldCheck, title: "Your data stays local", text: "This build runs entirely on your machine." },
];

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const { campusLabel } = useUniversity();

  return (
    <div className="auth">
      <div className="auth__panel">
        <motion.div
          className="auth__form"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link to="/" className="brand auth__brand">
            <span className="brand__mark" aria-hidden="true">
              C
            </span>
            <span className="brand__text">
              <strong>Campora</strong>
              <em>campus marketplace</em>
            </span>
          </Link>

          <h1 className="auth__title">{title}</h1>
          <p className="auth__subtitle">{subtitle}</p>

          {children}

          <div className="auth__footer">{footer}</div>
        </motion.div>
      </div>

      <aside className="auth__aside">
        <div className="auth__aside-media">
          <SmartImage
            src={HERO_IMAGES.shopping}
            alt="Students shopping on campus"
            ratio="wide"
            fallbackLabel="Campora"
          />
        </div>
        <div className="auth__aside-body">
          <p className="eyebrow">Welcome to Campora</p>
          <h2>Everything your campus sells, in one place</h2>
          <p className="auth__aside-text">
            Currently serving <strong>{campusLabel}</strong>. Groceries, meals, textbooks, dorm gear
            and student-made services — delivered while you wait.
          </p>
          <ul className="auth__points">
            {POINTS.map((point) => (
              <li key={point.title}>
                <span className="auth__point-icon">
                  <point.icon size={17} aria-hidden="true" />
                </span>
                <span>
                  <strong>{point.title}</strong>
                  <em>{point.text}</em>
                </span>
              </li>
            ))}
          </ul>
          <p className="auth__aside-cta">
            <Store size={15} aria-hidden="true" /> Have something to sell?{" "}
            <Link to="/sell">Open a campus store</Link>.
          </p>
        </div>
        <p className="auth__campus">
          <GraduationCap size={14} aria-hidden="true" /> Set your campus from the header at any time.
        </p>
      </aside>
    </div>
  );
}

export function AuthAside({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
