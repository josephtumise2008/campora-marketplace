import { NavLink, Outlet, Link } from "react-router-dom";
import {
  BarChart3,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { sellerService } from "../services/marketplace";
import { useAsync } from "../hooks/useAsync";
import { cx } from "../utils/format";
import { StoreLogo } from "../components/ui/SmartImage";
import { PageLoader } from "../components/ui/Feedback";

const LINKS = [
  { to: "/seller", label: "Dashboard", short: "Home", icon: LayoutDashboard, end: true },
  { to: "/seller/orders", label: "Orders", short: "Orders", icon: ShoppingBag, end: false },
  { to: "/seller/products", label: "Products", short: "Items", icon: Package, end: false },
  { to: "/seller/customers", label: "Customers", short: "People", icon: Users, end: false },
  { to: "/seller/store", label: "Store settings", short: "Settings", icon: Settings, end: false },
];

/** One list of links, rendered into the sidebar on >= 640px. The label is
 *  always in `data-label` as well as in the markup because below 1024px the
 *  visible text is hidden and the collapsed rail shows a CSS tooltip. */
function SellerNavLinks({ variant }: { variant: "full" | "tabs" }) {
  return (
    <>
      {LINKS.map((link) => {
        const Icon = link.icon;
        if (variant === "tabs") {
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => cx("seller-tab", isActive && "is-active")}
            >
              <Icon size={21} aria-hidden="true" />
              <span className="seller-tab__label">{link.short}</span>
            </NavLink>
          );
        }
        return (
          <li key={link.to} className="seller-side__item">
            <NavLink
              to={link.to}
              end={link.end}
              className={({ isActive }) => cx("seller-side__link", isActive && "is-active")}
              data-label={link.label}
            >
              <Icon size={19} aria-hidden="true" />
              <span className="seller-side__label">{link.label}</span>
            </NavLink>
          </li>
        );
      })}
    </>
  );
}

function SellerGate({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container page">
      <div className="seller-gate">
        <span className="seller-gate__icon">{icon}</span>
        <h1>{title}</h1>
        <p>{body}</p>
        <div className="seller-gate__actions">{children}</div>
      </div>
    </div>
  );
}

export function SellerLayout() {
  const { user } = useAuth();
  const { data: store, loading, error } = useAsync(() => sellerService.myStore(), []);

  if (loading && !store) return <PageLoader label="Opening your seller workspace" />;

  if (error || !store) {
    return (
      <SellerGate
        icon={<Store size={26} aria-hidden="true" />}
        title="You do not have a store yet"
        body="Apply to sell on Campora and, once your store is approved, this dashboard opens with your revenue, orders and products."
      >
        <Link to="/sell" className="btn btn--primary">
          Start a seller application
        </Link>
        <Link to="/explore" className="btn btn--ghost">
          Back to the marketplace
        </Link>
      </SellerGate>
    );
  }

  if (store.verification !== "verified") {
    const suspended = store.verification === "suspended";
    return (
      <SellerGate
        icon={<Store size={26} aria-hidden="true" />}
        title={suspended ? "Your store is suspended" : "Your application is under review"}
        body={
          suspended
            ? "Campora support has paused this store. Reply to the review email to restore access to the seller workspace."
            : `Thanks for applying — ${store.name} is with the Campora team. Your dashboard, products and orders open as soon as an admin approves the store.`
        }
      >
        <Link to="/account" className="btn btn--primary">
          Back to my account
        </Link>
        <Link to="/explore" className="btn btn--ghost">
          Browse the marketplace
        </Link>
      </SellerGate>
    );
  }

  return (
    <div className="seller-shell">
      <aside className="seller-side" aria-label="Seller tools">
        <div className="seller-side__inner">
          <div className="seller-side__identity">
            <StoreLogo logo={store.logo} name={store.name} size="sm" />
            <div className="seller-side__idtext">
              <p className="seller-side__name">{store.name}</p>
              <p className="seller-side__status">
                <span className="seller-side__dot" aria-hidden="true" />
                Verified store
              </p>
            </div>
          </div>

          <nav className="seller-side__nav">
            <ul>
              <SellerNavLinks variant="full" />
            </ul>
          </nav>

          <div className="seller-side__foot">
            <Link to={`/stores/${store.slug}`} className="seller-side__store-link">
              <BarChart3 size={16} aria-hidden="true" />
              <span className="seller-side__label">View public store</span>
            </Link>
            <p className="seller-side__hint">{user?.email}</p>
          </div>
        </div>
      </aside>

      <main className="seller-main">
        <div className="seller-main__inner">
          <Outlet />
        </div>
      </main>

      <nav className="seller-tabs" aria-label="Seller sections">
        <SellerNavLinks variant="tabs" />
      </nav>
    </div>
  );
}