import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Menu, ShoppingBag, Store, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useBodyScrollLock } from "../../hooks/useAsync";
import { cx } from "../../utils/format";
import { SearchBar } from "./SearchBar";
import { UniversityPicker } from "./UniversityPicker";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";

const NAV_LINKS = [
  { to: "/explore", label: "Explore" },
  { to: "/stores", label: "Stores" },
  { to: "/category/groceries", label: "Groceries" },
  { to: "/category/food", label: "Food" },
  { to: "/deals", label: "Deals" },
];

export function Navbar() {
  const { isAuthenticated } = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useBodyScrollLock(menuOpen);

  // Close the mobile menu on navigation. Adjusting during render (rather than in
  // an effect) avoids a flash of the open menu on the new page.
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    if (menuOpen) setMenuOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <div className="announce">
        <div className="container announce__inner">
          <p>
            <strong>Free campus delivery</strong> on orders over $35 from verified stores.
          </p>
          <div className="announce__links">
            <Link to="/sell">Sell on Campora</Link>
            <Link to="/help">Help</Link>
          </div>
        </div>
      </div>

      <header className={cx("navbar", scrolled && "navbar--scrolled")}>
        <div className="container navbar__inner">
          <button
            type="button"
            className="icon-btn navbar__burger"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu size={20} aria-hidden="true" />
          </button>

          <Link to="/" className="brand" aria-label="Campora home">
            <span className="brand__mark" aria-hidden="true">
              C
            </span>
            <span className="brand__text">
              <strong>Campora</strong>
              <em>campus marketplace</em>
            </span>
          </Link>

          <nav className="navbar__nav" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => cx("navbar__link", isActive && "is-active")}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="navbar__search">
            <SearchBar />
          </div>

          <div className="navbar__actions">
            <UniversityPicker compact />
            {isAuthenticated ? <NotificationBell /> : null}
            <Link
              to="/account/wishlist"
              className="icon-btn"
              aria-label={`Saved items${wishlist.productIds.length ? `, ${wishlist.productIds.length} saved` : ""}`}
            >
              <Heart size={19} aria-hidden="true" />
              {wishlist.productIds.length > 0 ? (
                <span className="icon-btn__badge">{wishlist.productIds.length}</span>
              ) : null}
            </Link>
            <button
              type="button"
              className="icon-btn"
              onClick={cart.openCart}
              aria-label={`Open cart, ${cart.count} item${cart.count === 1 ? "" : "s"}`}
            >
              <ShoppingBag size={19} aria-hidden="true" />
              {cart.count > 0 ? <span className="icon-btn__badge">{cart.count}</span> : null}
            </button>
            <UserMenu />
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              className="mobile-menu__sheet"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
            >
              <div className="mobile-menu__head">
                <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
                  <span className="brand__mark" aria-hidden="true">
                    C
                  </span>
                  <span className="brand__text">
                    <strong>Campora</strong>
                    <em>campus marketplace</em>
                  </span>
                </Link>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

              <SearchBar variant="page" onSubmitted={() => setMenuOpen(false)} />

              <nav className="mobile-menu__nav" aria-label="Mobile">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) => cx("mobile-menu__link", isActive && "is-active")}
                  >
                    {link.label}
                  </NavLink>
                ))}
                <NavLink to="/account/orders" className="mobile-menu__link">
                  My orders
                </NavLink>
                <NavLink to="/account/wishlist" className="mobile-menu__link">
                  Saved items
                </NavLink>
                <NavLink to="/sell" className="mobile-menu__link">
                  Sell on Campora
                </NavLink>
              </nav>

              <div className="mobile-menu__foot">
                <UniversityPicker />
              </div>
            </motion.div>
            <button
              type="button"
              className="mobile-menu__scrim"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export function SellCta({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/sell" className={cx("sell-cta", compact && "sell-cta--compact")}>
      <Store size={16} aria-hidden="true" />
      {compact ? "Sell" : "Start selling on Campora"}
    </Link>
  );
}
