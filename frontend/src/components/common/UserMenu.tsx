import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Settings,
  ShieldCheck,
  Store,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useClickOutside } from "../../hooks/useAsync";
import { cx, initials } from "../../utils/format";
import { Avatar } from "../ui/SmartImage";

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  useClickOutside(ref, () => setOpen(false));

  if (!user) {
    return (
      <div className="usermenu usermenu--guest">
        <Link to="/login" className="btn btn--ghost btn--sm">
          Log in
        </Link>
        <Link to="/register" className="btn btn--primary btn--sm">
          Join Campora
        </Link>
      </div>
    );
  }

  const links = [
    { to: "/account", label: "My account", icon: <UserIcon size={16} aria-hidden="true" /> },
    { to: "/account/orders", label: "My orders", icon: <Package size={16} aria-hidden="true" /> },
    { to: "/account/wishlist", label: "Saved items", icon: <Heart size={16} aria-hidden="true" /> },
    { to: "/account/addresses", label: "Addresses", icon: <MapPin size={16} aria-hidden="true" /> },
    { to: "/account/settings", label: "Settings", icon: <Settings size={16} aria-hidden="true" /> },
  ];

  if (user.role === "seller") {
    links.splice(1, 0, {
      to: "/seller",
      label: "Seller dashboard",
      icon: <LayoutDashboard size={16} aria-hidden="true" />,
    });
  }
  if (user.role === "admin") {
    links.unshift({
      to: "/admin",
      label: "Admin console",
      icon: <ShieldCheck size={16} aria-hidden="true" />,
    });
    links.splice(2, 0, {
      to: "/sell",
      label: "Seller tools",
      icon: <Store size={16} aria-hidden="true" />,
    });
  }

  return (
    <div className="usermenu" ref={ref}>
      <button
        type="button"
        className="usermenu__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar src={user.avatar} name={user.name} size={32} />
        <span className="usermenu__name">{user.name.split(" ")[0] || initials(user.name)}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="usermenu__panel"
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
          >
            <div className="usermenu__header">
              <Avatar src={user.avatar} name={user.name} size={40} />
              <div>
                <p className="usermenu__full-name">{user.name}</p>
                <p className="usermenu__email">{user.email}</p>
                {user.university?.name ? (
                  <p className="usermenu__campus">{user.university.name}</p>
                ) : null}
              </div>
            </div>

            <ul className="usermenu__list">
              {links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    role="menuitem"
                    className={cx("usermenu__link")}
                    onClick={() => setOpen(false)}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="usermenu__link usermenu__link--danger"
              role="menuitem"
              onClick={() => {
                logout();
                setOpen(false);
                navigate("/");
              }}
            >
              <LogOut size={16} aria-hidden="true" />
              Log out
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
