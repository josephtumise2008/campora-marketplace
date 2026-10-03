import { Link } from "react-router-dom";
import { GraduationCap, Heart, Store, Truck } from "lucide-react";
import { useUniversity } from "../../context/UniversityContext";
import { useAuth } from "../../context/AuthContext";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { to: "/explore", label: "Explore all products" },
      { to: "/deals", label: "Deals of the week" },
      { to: "/stores", label: "Campus stores" },
      { to: "/category/groceries", label: "Groceries & essentials" },
      { to: "/category/food", label: "Food & drinks" },
    ],
  },
  {
    title: "Sell",
    links: [
      { to: "/sell", label: "Start selling" },
      { to: "/sell#how-it-works", label: "How it works" },
      { to: "/sell#fees", label: "Fees & payouts" },
      { to: "/help#sellers", label: "Seller guide" },
    ],
  },
  {
    title: "Account",
    links: [
      { to: "/account", label: "My account" },
      { to: "/account/orders", label: "Order history" },
      { to: "/account/wishlist", label: "Saved items" },
      { to: "/account/addresses", label: "Delivery addresses" },
    ],
  },
  {
    title: "Campora",
    links: [
      { to: "/about", label: "About us" },
      { to: "/contact", label: "Contact" },
      { to: "/help", label: "Help centre" },
      { to: "/terms", label: "Terms of service" },
      { to: "/privacy", label: "Privacy policy" },
    ],
  },
];

export function Footer() {
  const { university } = useUniversity();
  const { user } = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer__top">
        <div className="footer__brand">
          <Link to="/" className="brand brand--footer">
            <span className="brand__mark" aria-hidden="true">
              C
            </span>
            <span className="brand__text">
              <strong>Campora</strong>
              <em>campus marketplace</em>
            </span>
          </Link>
          <p className="footer__pitch">
            Campora connects students with verified campus sellers — groceries, meals, textbooks,
            tech, dorm essentials and student-made services, all delivered on campus.
          </p>
          <p className="footer__campus">
            <GraduationCap size={15} aria-hidden="true" />
            Currently serving {university ? university.name : "campuses across the US"}
            {university ? ` · ${university.city}, ${university.state}` : ""}
          </p>
          <ul className="footer__perks">
            <li>
              <Truck size={15} aria-hidden="true" /> Same-day campus delivery
            </li>
            <li>
              <Store size={15} aria-hidden="true" /> Verified student sellers
            </li>
            <li>
              <Heart size={15} aria-hidden="true" /> Student-first support
            </li>
          </ul>
        </div>

        <div className="footer__columns">
          {COLUMNS.map((column) => (
            <nav className="footer__column" key={column.title} aria-label={column.title}>
              <h2>{column.title}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.to}-${link.label}`}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="container footer__bottom">
        <p>
          © {year} Campora. A local demo marketplace — payments are simulated and no orders ship
          anywhere.
        </p>
        <p className="footer__legal">
          <Link to="/terms">Terms</Link>
          <span aria-hidden="true">·</span>
          <Link to="/privacy">Privacy</Link>
          <span aria-hidden="true">·</span>
          <Link to="/contact">Contact</Link>
          {user?.role === "admin" ? (
            <>
              <span aria-hidden="true">·</span>
              <Link to="/admin">Admin</Link>
            </>
          ) : null}
        </p>
      </div>
    </footer>
  );
}
