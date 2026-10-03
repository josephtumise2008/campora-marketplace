import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Package, Search } from "lucide-react";
import { orderService } from "../../services/marketplace";
import type { Order, OrderStatus } from "../../types";
import { useAsync } from "../../hooks/useAsync";
import { currency, cx, formatDate, pluralize } from "../../utils/format";
import { PageHeader } from "../../components/common/SectionHeader";
import { OrderStatusBadge } from "../../components/common/OrderBits";
import { EmptyState, ErrorState, RowsSkeleton } from "../../components/ui/Feedback";
import { SmartImage } from "../../components/ui/SmartImage";
import { Pagination } from "../../components/ui/Pagination";

const STATUSES: (OrderStatus | "")[] = [
  "",
  "Pending",
  "Confirmed",
  "Preparing",
  "Ready",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

export default function AccountOrdersPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const { data, loading, error, reload } = useAsync(
    () => orderService.mine({ status, page, limit: 10 }),
    [status, page]
  );

  const orders: Order[] = (data?.items || []).filter((order) =>
    q
      ? order.orderNumber.toLowerCase().includes(q.toLowerCase()) ||
        order.items.some((item) => item.name.toLowerCase().includes(q.toLowerCase()))
      : true
  );

  return (
    <div className="stack-lg">
      <PageHeader
        title="My orders"
        description="Every order you have placed, with live status from each seller."
      />

      <div className="filters-toolbar">
        <label className="field field--search">
          <span className="sr-only">Search orders</span>
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={q}
            placeholder="Search by order number or product"
            onChange={(event) => setQ(event.target.value)}
          />
        </label>
      </div>

      <div className="tab-row" role="tablist" aria-label="Filter orders by status">
        {STATUSES.map((option) => (
          <button
            key={option || "all"}
            type="button"
            role="tab"
            aria-selected={status === option}
            className={cx("tab", status === option && "is-active")}
            onClick={() => {
              setStatus(option);
              setPage(1);
            }}
          >
            {option || "All orders"}
          </button>
        ))}
      </div>

      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {loading && !data ? <RowsSkeleton count={4} /> : null}

      {!loading && orders.length === 0 ? (
        <EmptyState
          icon={<Package size={26} aria-hidden="true" />}
          title="No orders here"
          description={
            q
              ? "No orders match that search."
              : "When you place an order it will appear here with live status updates."
          }
          action={
            <Link to="/explore" className="btn btn--primary">
              Browse products
            </Link>
          }
        />
      ) : null}

      <ul className="order-cards">
        {orders.map((order) => (
          <li key={order._id} className="order-card">
            <header className="order-card__head">
              <div>
                <p className="order-card__number">{order.orderNumber}</p>
                <p className="order-card__date">
                  Placed {formatDate(order.placedAt)} · {pluralize(order.items.length, "item")} ·{" "}
                  {currency(order.totals?.total)}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
            </header>

            <ul className="order-card__items">
              {order.items.slice(0, 4).map((item, index) => (
                <li key={`${item.name}-${index}`}>
                  <SmartImage src={item.image} alt={item.name} ratio="square" fallbackLabel={item.name} />
                  <span>
                    <strong>{item.name}</strong>
                    <em>
                      {item.storeName} · {currency(item.price)} × {item.quantity}
                    </em>
                  </span>
                </li>
              ))}
              {order.items.length > 4 ? (
                <li className="order-card__more">+{order.items.length - 4} more</li>
              ) : null}
            </ul>

            <footer className="order-card__foot">
              <span>
                {[...new Set(order.items.map((item) => item.storeName))].join(" · ")}
              </span>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => navigate(`/account/orders/${order._id}`)}
              >
                Track order
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </footer>
          </li>
        ))}
      </ul>

      {data && data.pagination.totalPages > 1 ? (
        <Pagination pagination={data.pagination} onChange={setPage} />
      ) : null}
    </div>
  );
}
