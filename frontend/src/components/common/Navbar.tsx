import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { Heart, ShoppingBag, Store, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useBodyScrollLock } from "../../hooks/useAsync";
import { SOCIAL_LINKS } from "../../data/socialLinks";
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

/** Matches --ease-drawer. Opening eases out, closing is a touch quicker. */
const DRAWER_EASE = [0.32, 0.72, 0, 1] as const;
const OPEN_S = 0.35;
const CLOSE_S = 0.25;
/** Horizontal travel, as a fraction of sheet width, that commits a close. */
const CLOSE_DISTANCE = 0.32;
/** Leftward velocity (px/s) that commits a close regardless of distance. */
const CLOSE_VELOCITY = -450;

/** Outer layer: owns no animated properties, but carrying the exit variant is
 *  what tells AnimatePresence to keep the tree mounted until the sheet has
 *  finished sliding out. */
const layer = {
  hidden: {},
  visible: {},
};

/** The sheet slides on transform only — never left/width — so it stays on the
 *  compositor. Open and close carry their own durations.
 *  With reduced motion requested, the drawer cross-fades in place instead: no
 *  travel, no stagger offsets, nothing to trigger vestibular discomfort. */
function makePanel(reduce: boolean) {
  if (reduce) {
    return {
      hidden: { opacity: 0, transition: { duration: 0.18 } },
      visible: { opacity: 1, transition: { duration: 0.18 } },
    };
  }
  return {
    hidden: { x: "-100%", transition: { duration: CLOSE_S, ease: DRAWER_EASE } },
    visible: { x: 0, transition: { duration: OPEN_S, ease: DRAWER_EASE } },
  };
}

/** Staggered content. `custom` is the item's index, which sets its delay.
 *  Exiting is a plain quick fade rather than a reverse stagger. Under reduced
 *  motion every item fades together instead of arriving one at a time. */
function makeItem(reduce: boolean) {
  if (reduce) {
    return {
      hidden: { opacity: 0, transition: { duration: 0.15 } },
      visible: { opacity: 1, transition: { duration: 0.15 } },
    };
  }
  return {
    hidden: { opacity: 0, y: 12, transition: { duration: 0.12 } },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.28, ease: DRAWER_EASE, delay: index * 0.04 },
    }),
  };
}

/** How far the sheet has travelled left, as 0..1 of its own width. */
function dragProgress(offsetX: number, width: number) {
  if (!width) return 0;
  return Math.min(1, Math.max(0, -offsetX / width));
}

export function Navbar() {
  const { isAuthenticated } = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Measured so the drag constraint is a real box the width of the sheet.
  // A single-point constraint with zero elasticity pins the sheet at x=0 and it
  // would refuse to follow the finger; a box lets it track 1:1 up to fully
  // closed while still refusing to be dragged open past 0.
  const [sheetWidth, setSheetWidth] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  // A motion value, not state: the scrim follows the finger on every frame of
  // a swipe and re-rendering React 60 times a second would drop frames on
  // low-end phones.
  const scrimOpacity = useMotionValue(0);
  // The blur rides the same motion value as the opacity, so it eases in with
  // the fade instead of appearing at full strength behind a transparent
  // element. A plain CSS `transition: backdrop-filter` cannot do this, because
  // the value is identical in both states and so has nothing to interpolate.
  const scrimBlur = useTransform(scrimOpacity, [0, 1], ["blur(0px)", "blur(6px)"]);
  // Variants are rebuilt only when the motion preference changes.
  const panel = useMemo(() => makePanel(!!reduceMotion), [reduceMotion]);
  const item = useMemo(() => makeItem(!!reduceMotion), [reduceMotion]);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useBodyScrollLock(menuOpen);

  // Close the mobile menu on navigation. Adjusting during render (rather than in
  // an effect) avoids a flash of the open menu on the new page. This is a
  // backstop only: tapping the link for the route you are already on does not
  // change the pathname, so every drawer link also closes explicitly.
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    if (menuOpen) closeMenu();
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track the sheet width so the swipe constraint box matches it exactly,
  // including across rotation and the 400px breakpoint where it goes full-bleed.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const el = sheetRef.current;
    if (!el) return undefined;
    const measure = () => setSheetWidth(el.offsetWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [menuOpen]);

  // Fade the scrim with the drawer's own timing. This is what makes the blur
  // ease in rather than pop, and it keeps fading out underneath the sheet as
  // the sheet slides away.
  useEffect(() => {
    if (reduceMotion) {
      scrimOpacity.set(menuOpen ? 1 : 0);
      return undefined;
    }
    const controls = animate(scrimOpacity, menuOpen ? 1 : 0, {
      duration: menuOpen ? 0.28 : CLOSE_S,
      ease: DRAWER_EASE,
    });
    return () => controls.stop();
  }, [menuOpen, reduceMotion, scrimOpacity]);

  // Escape closes the drawer and hands focus back to the burger. Tab is
  // cycled inside the sheet so focus cannot wander into the inert page
  // behind the scrim, and opening moves focus onto the close button.
  useEffect(() => {
    if (!menuOpen) return;
    const sheet = sheetRef.current;
    sheet?.querySelector<HTMLElement>(".mobile-menu__head button")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        burgerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !sheet) return;
      const focusable = sheet.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, closeMenu]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <div className="announce">
        <div className="container announce__inner">
          <p>
            <strong>Free campus delivery</strong>
            <span className="announce__more"> on orders over $35 from verified stores.</span>
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
            ref={burgerRef}
            className={cx("icon-btn navbar__burger", menuOpen && "navbar__burger--open")}
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <span className="burger__bars" aria-hidden="true">
              <span className="burger__bar" />
              <span className="burger__bar" />
              <span className="burger__bar" />
            </span>
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
            variants={layer}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div
              className="mobile-menu__sheet"
              id="mobile-menu"
              ref={sheetRef}
              variants={panel}
              drag={reduceMotion ? false : "x"}
              dragConstraints={{ left: -sheetWidth, right: 0 }}
              dragElastic={{ left: 0, right: 0 }}
              dragDirectionLock
              // Without these, releasing a short drag flings the sheet further
              // left on its release velocity and leaves it stranded off-screen.
              // Inertia off + snap-to-origin means a rejected swipe glides back
              // to fully open, and an accepted one hands off to the exit
              // animation instead.
              dragMomentum={false}
              dragSnapToOrigin
              onDrag={(_event, info) => {
                scrimOpacity.set(dragProgress(info.offset.x, sheetWidth));
              }}
              onDragEnd={(_event, info) => {
                const progress = dragProgress(info.offset.x, sheetWidth);
                if (info.velocity.x < CLOSE_VELOCITY || progress > CLOSE_DISTANCE) {
                  closeMenu();
                } else {
                  animate(scrimOpacity, 1, { duration: 0.22, ease: DRAWER_EASE });
                }
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
            >
              <motion.div variants={item} custom={0} className="mobile-menu__head">
                <Link to="/" className="brand" onClick={closeMenu}>
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
                  onClick={closeMenu}
                  aria-label="Close menu"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </motion.div>

              <div className="mobile-menu__body">
                <motion.div variants={item} custom={1}>
                  <SearchBar variant="page" onSubmitted={closeMenu} />
                </motion.div>

                {!isAuthenticated ? (
                  <motion.div variants={item} custom={2} className="mobile-menu__auth">
                    <Link
                      to="/login"
                      className="btn btn--outline btn--block"
                      onClick={closeMenu}
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      className="btn btn--primary btn--block"
                      onClick={closeMenu}
                    >
                      Join Campora
                    </Link>
                  </motion.div>
                ) : null}

                <nav className="mobile-menu__nav" aria-label="Mobile">
                  {NAV_LINKS.map((link, i) => (
                    <motion.div key={link.to} variants={item} custom={3 + i}>
                      <NavLink
                        to={link.to}
                        onClick={closeMenu}
                        /* Anchors are natively draggable, and a link drag
                           hijacks the pointer stream before Framer Motion can
                           claim it, so a swipe that begins on a link would
                           never close the drawer. */
                        draggable={false}
                        className={({ isActive }) =>
                          cx("mobile-menu__link", isActive && "is-active")
                        }
                      >
                        {link.label}
                      </NavLink>
                    </motion.div>
                  ))}
                  <motion.div variants={item} custom={8}>
                    <NavLink to="/account/orders" className="mobile-menu__link" onClick={closeMenu} draggable={false}>
                      My orders
                    </NavLink>
                  </motion.div>
                  <motion.div variants={item} custom={9}>
                    <NavLink
                      to="/account/wishlist"
                      className="mobile-menu__link"
                      onClick={closeMenu}
                      draggable={false}
                    >
                      Saved items
                    </NavLink>
                  </motion.div>
                  <motion.div variants={item} custom={10}>
                    <NavLink to="/sell" className="mobile-menu__link" onClick={closeMenu} draggable={false}>
                      Sell on Campora
                    </NavLink>
                  </motion.div>
                  <motion.div variants={item} custom={11}>
                    <NavLink to="/help" className="mobile-menu__link" onClick={closeMenu} draggable={false}>
                      Help centre
                    </NavLink>
                  </motion.div>
                </nav>
              </div>

              <motion.div variants={item} custom={12} className="mobile-menu__foot">
                <UniversityPicker />
                <div className="social-row">
                  <span className="social-row__label">Follow</span>
                  {SOCIAL_LINKS.map(({ id, label, href, icon: Icon }) => (
                    <a
                      key={id}
                      className="social-link"
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${label} (opens in a new tab)`}
                    >
                      <Icon size={17} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            <motion.button
              type="button"
              className="mobile-menu__scrim"
              style={{
                opacity: scrimOpacity,
                backdropFilter: scrimBlur,
                WebkitBackdropFilter: scrimBlur,
              }}
              onClick={closeMenu}
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