import { Link } from "react-router-dom";
import { ArrowRight, Heart, MapPin, Package, Sparkles, Store, Truck } from "lucide-react";
import { orderService, userService } from "../../services/marketplace";
import type { Address, Notification, Order } from "../../types";
import { useAsync } from "../../hooks/useAsync";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { currency, formatDate, pluralize, relativeTime } from "../../utils/format";
import { OrderStatusBadge } from "../../components/common/OrderBits";
import { ProductGrid } from "../../components/common/ProductCard";
import { PageHeader } from "../../components/common/SectionHeader";
import { SmartImage } from "../../components/ui/SmartImage";
import { StatTile } from "../../components/ui/Rating";
import { ErrorState, RowsSkeleton } from "../../components/ui/Feedback";

export default function AccountOverviewPage() {
  const { user } = useAuth();
  const wishlist = useWishlist();

  const orders = useAsync(() => orderService.mine({ limit: 3 }), []);
  const addresses = useAsync(() => userService.addresses(), []);
  const notifications = useAsync(() => userService.notifications(), []);

  const recent: Order[] = orders.data?.items ?? [];
  const active = recent.filter((order) => !["Delivered", "Cancelled"].includes(order.status));
  const lifetime = recent.reduce((sum, order) => sum + (order.totals?.total || 0), 0);
  const unread = notifications.data?.unread ?? 0;

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Your Campora"
        title={`Hi, ${user?.name?.split(" ")[0] || "there"}`}
        description="Track orders, manage delivery addresses and keep your campus favourites close."
        actions={
          <Link to="/explore" className="btn btn--primary">
            Continue shopping
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        }
      />

      <div className="stat-row">
        <StatTile
          label="Recent orders"
          value={orders.loading ? "…" : recent.length}
          hint={active.length ? `${active.length} still in progress` : "Nothing in progress"}
          icon={<Package size={18} aria-hidden="true" />}
        />
        <StatTile
          label="Recent spend"
          value={orders.loading ? "…" : currency(lifetime)}
          hint="Across your last orders"
          icon={<Truck size={18} aria-hidden="true" />}
          tone="brand"
        />
        <StatTile
          label="Saved items"
          value={wishlist.productIds.length}
          hint={`${pluralize(wishlist.storeIds.length, "store")} followed`}
          icon={<Heart size={18} aria-hidden="true" />}
          tone="success"
        />
        <StatTile
          label="Unread updates"
          value={unread}
          hint={unread ? "Order notifications waiting" : "You are all caught up"}
          icon={<Sparkles size={18} aria-hidden="true" />}
          tone={unread ? "warning" : "default"}
        />
      </div>

      <section className="panel">
        <header className="panel__head">
          <h2>Recent orders</h2>
          <Link to="/account/orders" className="link-arrow">
            All orders
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </header>

        {orders.error ? (
          <ErrorState message={orders.error} onRetry={orders.reload} />
        ) : null}

        {orders.loading && !orders.data ? <RowsSkeleton count={3} /> : null}

        {!orders.loading && recent.length === 0 ? (
          <div className="panel__empty">
            <p>You have not placed an order yet.</p>
            <Link to="/explore" className="btn btn--primary btn--sm">
              Browse the marketplace
            </Link>
          </div>
        ) : null}

        <ul className="order-list">
          {recent.map((order) => (
            <li key={order._id} className="order-row">
              <div className="order-row__thumbs">
                {order.items.slice(0, 3).map((item, index) => (
                  <SmartImage
                    key={`${item.name}-${index}`}
                    src={item.image}
                    alt={item.name}
                    ratio="square"
                    fallbackLabel={item.name}
                  />
                ))}
              </div>
              <div className="order-row__info">
                <p className="order-row__number">{order.orderNumber}</p>
                <p className="order-row__meta">
                  {formatDate(order.placedAt)} · {pluralize(order.items.length, "item")} ·{" "}
                  {currency(order.totals?.total)}
                </p>
                <p className="order-row__stores">
                  {[...new Set(order.items.map((item) => item.storeName))].join(" · ")}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
              <Link to={`/account/orders/${order._id}`} className="btn btn--secondary btn--sm">
                View
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="split-2">
        <section className="panel">
          <header className="panel__head">
            <h2>Delivery addresses</h2>
            <Link to="/account/addresses" className="link-arrow">
              Manage
            </Link>
          </header>
          {addresses.loading ? <RowsSkeleton count={2} /> : null}
          <ul className="address-list">
            {(addresses.data?.slice(0, 2) || []).map((entry: Address) => (
              <li key={entry._id}>
                <MapPin size={15} aria-hidden="true" />
                <span>
                  <strong>
                    {entry.label}
                    {entry.isDefault ? <span className="badge badge--success">Default</span> : null}
                  </strong>
                  <em>
                    {entry.line1}
                    {entry.line2 ? `, ${entry.line2}` : ""}, {entry.city}, {entry.state} {entry.zip}
                  </em>
                </span>
              </li>
            ))}
            {!addresses.loading && !(addresses.data || []).length ? (
              <li className="panel__empty">
                <p>No saved addresses yet.</p>
                <Link to="/account/addresses" className="btn btn--secondary btn--sm">
                  Add an address
                </Link>
              </li>
            ) : null}
          </ul>
        </section>

        <section className="panel">
          <header className="panel__head">
            <h2>Latest updates</h2>
            <Link to="/account/notifications" className="link-arrow">
              All
            </Link>
          </header>
          {notifications.loading ? <RowsSkeleton count={3} /> : null}
          <ul className="mini-notifications">
            {(notifications.data?.items || []).slice(0, 4).map((entry: Notification) => (
              <li key={entry._id} className={!entry.read ? "is-unread" : undefined}>
                <span className="mini-notifications__dot" aria-hidden="true" />
                <span>
                  <strong>{entry.title}</strong>
                  <em>{entry.body}</em>
                </span>
                <time dateTime={entry.createdAt}>{relativeTime(entry.createdAt)}</time>
              </li>
            ))}
            {!notifications.loading && !(notifications.data?.items || []).length ? (
              <li className="panel__empty">
                <p>No notifications yet.</p>
              </li>
            ) : null}
          </ul>
        </section>
      </div>

      {wishlist.products.length ? (
        <section className="panel">
          <header className="panel__head">
            <h2>From your saved list</h2>
            <Link to="/account/wishlist" className="link-arrow">
              See all
            </Link>
          </header>
          <ProductGrid products={wishlist.products.slice(0, 4)} compact />
        </section>
      ) : null}

      {user?.role === "seller" ? (
        <section className="panel panel--accent">
          <div>
            <h2>
              <Store size={18} aria-hidden="true" /> Your store is live
            </h2>
            <p>
              {user.store?.name} is {user.store?.verification}. Keep your stock updated and respond to
              new orders quickly to stay ranked in campus search.
            </p>
            <Link to="/seller" className="btn btn--primary btn--sm">
              Open seller dashboard
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
