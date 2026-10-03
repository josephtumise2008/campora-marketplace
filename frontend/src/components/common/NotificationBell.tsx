import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";
import { userService } from "../../services/marketplace";
import type { Notification } from "../../types";
import { relativeTime, cx } from "../../utils/format";
import { useClickOutside } from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";

export function NotificationBell() {
  const navigate = useNavigate();
  const toast = useToast();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  useClickOutside(ref, () => setOpen(false));

  const load = async (markRead = false) => {
    setLoading(true);
    try {
      const data = await userService.notifications();
      setItems(data.items);
      setUnread(data.unread);
      if (markRead && data.unread > 0) {
        await userService.markNotificationsRead();
        setUnread(0);
        setItems((current) => current.map((entry) => ({ ...entry, read: true })));
      }
    } catch (err) {
      toast.error("Could not load notifications", err instanceof Error ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bell" ref={ref}>
      <button
        type="button"
        className="icon-btn icon-btn--label"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) void load(true);
        }}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
      >
        <Bell size={18} aria-hidden="true" />
        {unread > 0 ? <span className="bell__badge">{unread > 9 ? "9+" : unread}</span> : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="bell__panel"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
          >
            <header className="bell__head">
              <h2>Notifications</h2>
              {unread > 0 ? (
                <button
                  type="button"
                  className="link-plain"
                  onClick={async () => {
                    await userService.markNotificationsRead();
                    setUnread(0);
                    setItems((current) => current.map((entry) => ({ ...entry, read: true })));
                  }}
                >
                  <CheckCheck size={14} aria-hidden="true" /> Mark all read
                </button>
              ) : null}
            </header>

            {loading && !items.length ? (
              <p className="bell__empty">Loading notifications…</p>
            ) : items.length === 0 ? (
              <p className="bell__empty">Nothing new. Order updates will show up here.</p>
            ) : (
              <ul className="bell__list">
                {items.slice(0, 8).map((entry) => (
                  <li key={entry._id} className={cx(!entry.read && "is-unread")}>
                    <Link
                      to={entry.link || "/account"}
                      onClick={() => setOpen(false)}
                      className="bell__item"
                    >
                      <span className="bell__item-title">{entry.title}</span>
                      <span className="bell__item-body">{entry.body}</span>
                      <span className="bell__item-at">{relativeTime(entry.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <footer className="bell__foot">
              <Link to="/account" onClick={() => setOpen(false)}>
                Go to my account
              </Link>
              <button
                type="button"
                className="link-plain"
                onClick={() => {
                  setOpen(false);
                  navigate("/account");
                }}
              >
                Settings
              </button>
            </footer>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
