import { NavLink, Outlet } from "react-router-dom";
import { Bell, Heart, LayoutDashboard, MapPin, Package, Settings, ShieldCheck, Store, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { cx } from "../utils/format";
import { Avatar } from "../components/ui/SmartImage";

const LINKS = [
  { to: "/account", label: "Overview", icon: <LayoutDashboard size={17} aria-hidden="true" />, end: true },
  { to: "/account/orders", label: "Orders", icon: <Package size={17} aria-hidden="true" /> },
  { to: "/account/wishlist", label: "Saved items", icon: <Heart size={17} aria-hidden="true" /> },
  { to: "/account/addresses", label: "Addresses", icon: <MapPin size={17} aria-hidden="true" /> },
  { to: "/account/notifications", label: "Notifications", icon: <Bell size={17} aria-hidden="true" /> },
  { to: "/account/settings", label: "Settings", icon: <Settings size={17} aria-hidden="true" /> },
];

export function AccountLayout() {
  const { user } = useAuth();

  return (
    <div className="container page">
      <aside className="account-layout">
        <div className="account-layout__card">
          <div className="account-layout__identity">
            <Avatar src={user?.avatar} name={user?.name || "Student"} size={52} />
            <div>
              <p className="account-layout__name">{user?.name}</p>
              <p className="account-layout__email">{user?.email}</p>
              {user?.university?.name ? (
                <p className="account-layout__campus">{user.university.name}</p>
              ) : null}
            </div>
          </div>
          <span className={cx("badge", user?.role === "admin" ? "badge--brand" : "badge--brand-soft")}>
            {user?.role === "admin" ? (
              <ShieldCheck size={12} aria-hidden="true" />
            ) : user?.role === "seller" ? (
              <Store size={12} aria-hidden="true" />
            ) : (
              <User size={12} aria-hidden="true" />
            )}
            {user?.role === "admin" ? "Administrator" : user?.role === "seller" ? "Seller" : "Student"}
          </span>

          <nav className="account-layout__nav" aria-label="Account">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => cx("account-layout__link", isActive && "is-active")}
              >
                {link.icon}
                {link.label}
              </NavLink>
            ))}
          </nav>

          {user?.role === "seller" || user?.role === "admin" ? (
            <div className="account-layout__switch">
              <p>Running a store?</p>
              <NavLink to="/seller" className="btn btn--secondary btn--sm btn--block">
                <Store size={15} aria-hidden="true" />
                Seller dashboard
              </NavLink>
            </div>
          ) : null}

          {user?.role === "admin" ? (
            <div className="account-layout__switch">
              <p>Marketplace admin?</p>
              <NavLink to="/admin" className="btn btn--secondary btn--sm btn--block">
                <ShieldCheck size={15} aria-hidden="true" />
                Admin console
              </NavLink>
            </div>
          ) : null}
        </div>

        <div className="account-layout__main">
          <Outlet />
        </div>
      </aside>
    </div>
  );
}
