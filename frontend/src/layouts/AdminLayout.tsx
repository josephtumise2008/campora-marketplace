import { NavLink, Outlet, Link } from "react-router-dom";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tags,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { marketplaceService } from "../services/marketplace";
import { useAsync } from "../hooks/useAsync";
import { cx } from "../utils/format";

const LINKS = [
  { to: "/admin", label: "Overview", icon: <LayoutDashboard size={17} aria-hidden="true" />, end: true },
  { to: "/admin/users", label: "Users", icon: <Users size={17} aria-hidden="true" /> },
  { to: "/admin/stores", label: "Stores", icon: <Store size={17} aria-hidden="true" /> },
  { to: "/admin/products", label: "Products", icon: <Boxes size={17} aria-hidden="true" /> },
  { to: "/admin/orders", label: "Orders", icon: <ShoppingBag size={17} aria-hidden="true" /> },
  { to: "/admin/categories", label: "Categories", icon: <Tags size={17} aria-hidden="true" /> },
  { to: "/admin/reports", label: "Reports", icon: <BarChart3 size={17} aria-hidden="true" /> },
];

export function AdminLayout() {
  const { user } = useAuth();
  const { data } = useAsync(() => marketplaceService.config(), []);

  return (
    <div className="admin">
      <aside className="admin-layout">
        <div className="admin-layout__brand">
          <span className="admin-layout__mark" aria-hidden="true">
            <ShieldCheck size={20} />
          </span>
          <div>
            <p className="admin-layout__title">Campora Admin</p>
            <p className="admin-layout__subtitle">Marketplace operations</p>
          </div>
        </div>

        <nav className="admin-layout__nav" aria-label="Admin sections">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => cx("admin-layout__link", isActive && "is-active")}
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-layout__foot">
          <Link to="/explore" className="btn btn--ghost btn--sm btn--block">
            <Receipt size={14} aria-hidden="true" />
            View marketplace
          </Link>
          <p className="admin-layout__hint">
            Signed in as <strong>{user?.name || user?.email}</strong>
            {data?.marketplace
              ? ` · ${data.marketplace.productCount} products / ${data.marketplace.storeCount} stores`
              : ""}
          </p>
        </div>
      </aside>

      <div className="admin-layout__main">
        <Outlet />
      </div>
    </div>
  );
}
