import {
  CheckCircle2,
  ChefHat,
  Clock3,
  PackageCheck,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import type { Order, OrderStatus } from "../../types";
import { formatDateTime, ORDER_STATUS_ORDER, ORDER_STATUS_TONE, cx } from "../../utils/format";
import { SmartImage } from "../ui/SmartImage";

const STATUS_ICON: Record<OrderStatus, React.ReactNode> = {
  Pending: <Clock3 size={13} aria-hidden="true" />,
  Confirmed: <CheckCircle2 size={13} aria-hidden="true" />,
  Preparing: <ChefHat size={13} aria-hidden="true" />,
  Ready: <PackageCheck size={13} aria-hidden="true" />,
  "Out for Delivery": <Truck size={13} aria-hidden="true" />,
  Delivered: <CheckCircle2 size={13} aria-hidden="true" />,
  Cancelled: <XCircle size={13} aria-hidden="true" />,
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cx("badge", ORDER_STATUS_TONE[status] || "badge--neutral")}>
      {STATUS_ICON[status]}
      {status}
    </span>
  );
}

export function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "Cancelled") {
    return (
      <p className="order-progress order-progress--cancelled">
        <XCircle size={15} aria-hidden="true" /> This order was cancelled.
      </p>
    );
  }
  const index = ORDER_STATUS_ORDER.indexOf(status);
  return (
    <ol className="order-progress" aria-label="Order progress">
      {ORDER_STATUS_ORDER.map((step, stepIndex) => {
        const done = stepIndex <= index;
        const current = stepIndex === index;
        return (
          <li key={step} className={cx(done && "is-done", current && "is-current")}>
            <span className="order-progress__dot" aria-hidden="true" />
            <span className="order-progress__label">{step}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderTimeline({ order }: { order: Order }) {
  if (!order.timeline?.length) return null;
  return (
    <ol className="order-timeline">
      {order.timeline.map((entry, index) => (
        <li key={`${entry.status}-${index}`}>
          <span className="order-timeline__dot" aria-hidden="true" />
          <div>
            <p className="order-timeline__label">{entry.label || entry.status}</p>
            {entry.note ? <p className="order-timeline__note">{entry.note}</p> : null}
            <p className="order-timeline__at">{formatDateTime(entry.at)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function OrderItemRow({ item }: { item: Order["items"][number] }) {
  const productId = typeof item.product === "object" && item.product ? item.product._id : item.product;
  return (
    <li className="order-item">
      <SmartImage src={item.image} alt={item.name} ratio="square" fallbackLabel={item.name} />
      <div className="order-item__info">
        <p className="order-item__name">
          {productId ? <a href={`/products/${productId}`}>{item.name}</a> : item.name}
        </p>
        <p className="order-item__meta">
          {item.storeName} · Qty {item.quantity}
        </p>
      </div>
      <p className="order-item__price">
        {item.lineTotal?.toFixed ? `$${item.lineTotal.toFixed(2)}` : ""}
      </p>
    </li>
  );
}

export function OrderSummaryStrip({ order }: { order: Order }) {
  return (
    <ul className="order-items">
      {order.items.slice(0, 4).map((item, index) => (
        <OrderItemRow key={`${item.name}-${index}`} item={item} />
      ))}
      {order.items.length > 4 ? (
        <li className="order-items__more">+{order.items.length - 4} more item(s)</li>
      ) : null}
    </ul>
  );
}

export function OrderStatusTabs({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="tab-row" role="tablist" aria-label="Filter by status">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="tab"
          aria-selected={value === option}
          className={cx("tab", value === option && "is-active")}
          onClick={() => onChange(option)}
        >
          {option === "" ? "All" : option}
        </button>
      ))}
    </div>
  );
}

export function EmptyOrders({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <ShoppingBag size={24} aria-hidden="true" />
      </div>
      <h3 className="empty-state__title">No orders yet</h3>
      <p className="empty-state__description">
        When you place your first Campora order it will show up here with live status updates.
      </p>
      <div className="empty-state__action">
        <button type="button" className="btn btn--primary" onClick={onBrowse}>
          Browse the marketplace
        </button>
      </div>
    </div>
  );
}
