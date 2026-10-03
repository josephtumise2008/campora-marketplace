import { NavLink, Outlet, Link } from "react-router-dom";
import {
  Ban,
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
  { to: "/seller", label: "Dashboard", icon: <LayoutDashboard size={17} aria-hidden="true" />, end: true },
  { to: "/seller/orders", label: "Orders", icon: <ShoppingBag size={17} aria-hidden="true" /> },
  { to: "/seller/products", label: "Products", icon: <Package size={17} aria-hidden="true" /> },
  { to: "/seller/customers", label: "Customers", icon: <Users size={17} aria-hidden="true" /> },
  { to: "/seller/store", label: "Store settings", icon: <Settings size={17} aria-hidden="true" /> },
];

export function SellerLayout() {
  const { user } = useAuth();
  const { data, loading, error } = useAsync(() => sellerService.myStore(), []);

  if (loading && !data) return <PageLoader label="Opening your seller workspace" />;

  if (error || !data) {
    return (
      <div className="container page">
        <div className="seller-gate">
          <span className="seller-gate__icon">
            <Store size={26} aria-hidden="true" />
          </span>
          <h1>You do not have a store yet</h1>
          <p>
            Apply to sell on Campora and, once your store is approved, this dashboard opens with your
            revenue, orders and products.
          </p>
          <div className="seller-gate__actions">
            <Link to="/sell" className="btn btn--primary">
              Start a seller application
            </Link>
            <Link to="/explore" className="btn btn--ghost">
              Back to the marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const store = data;

  if (store.verification !== "verified") {
    const suspended = store.verification === "suspended";
    return (
      <div className="container page">
        <div className="seller-gate">
          <span className="seller-gate__icon">
            {suspended ? <Ban size={26} aria-hidden="true" /> : <Store size={26} aria-hidden="true" />}
          </span>
          <h1>{suspended ? "Your store is suspended" : "Your application is under review"}</h1>
          <p>
            {suspended
              ? "Campora support has paused this store. Reply to the review email to restore access to the seller workspace."
              : `Thanks for applying — ${store.name} is with the Campora team. Your dashboard, products and orders open as soon as an admin approves the store.`}
          </p>
          <div className="seller-gate__actions">
            <Link to="/account" className="btn btn--primary">
              Back to my account
            </Link>
            <Link to="/explore" className="btn btn--ghost">
              Browse the marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="seller">
      <aside className="seller-layout">
        <div className="seller-layout__card">
          <div className="seller-layout__identity">
            <StoreLogo logo={store.logo} name={store.name} size="lg" />
            <div>
              <p className="seller-layout__name">{store.name}</p>
              <p className="seller-layout__status">
                <span className="seller-layout__dot is-verified" aria-hidden="true" />
                Verified store
              </p>
            </div>
          </div>

          <nav className="seller-layout__nav" aria-label="Seller tools">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => cx("seller-layout__link", isActive && "is-active")}
              >
                {link.icon}
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="seller-layout__switch">
            <Link to={`/stores/${store.slug}`} className="btn btn--secondary btn--sm btn--block">
              <BarChart3 size={15} aria-hidden="true" />
              View my public store
            </Link>
            <p className="seller-layout__hint">Signed in as {user?.email}</p>
          </div>
        </div>

        <div className="seller-layout__main">
          <Outlet />
        </div>
      </aside>
    </div>
  );
}
