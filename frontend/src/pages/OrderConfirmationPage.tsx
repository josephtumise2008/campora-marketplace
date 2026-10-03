import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Copy,
  Home,
  MapPin,
  Package,
  Printer,
  Store,
  Truck,
} from "lucide-react";
import { orderService } from "../services/marketplace";
import type { Order } from "../types";
import { useAsync } from "../hooks/useAsync";
import { useToast } from "../context/ToastContext";
import { currency, formatDateTime } from "../utils/format";
import { OrderProgress, OrderStatusBadge, OrderTimeline } from "../components/common/OrderBits";
import { SmartImage } from "../components/ui/SmartImage";
import { ErrorState, LoadingBlock } from "../components/ui/Feedback";

export default function OrderConfirmationPage() {
  const { id = "" } = useParams();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync<Order>(() => orderService.one(id), [id]);

  if (loading && !data) {
    return (
      <div className="container page">
        <LoadingBlock label="Confirming your order" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container page">
        <ErrorState
          title="We could not load that order"
          message={error || undefined}
          onRetry={reload}
        />
        <p className="page-center">
          <Link to="/account/orders" className="btn btn--primary">
            View my orders
          </Link>
        </p>
      </div>
    );
  }

  const order = data;

  return (
    <div className="container page confirmation">
      <section className="confirmation__hero">
        <span className="confirmation__check" aria-hidden="true">
          <BadgeCheck size={34} />
        </span>
        <p className="eyebrow">Order confirmed</p>
        <h1>Thanks — your order is in</h1>
        <p className="confirmation__lead">
          Order <strong>{order.orderNumber}</strong> was placed on {formatDateTime(order.placedAt)}. Each
          seller has been notified and will update the status as they prepare your items.
        </p>
        <div className="confirmation__actions">
          <Link to="/account/orders" className="btn btn--primary">
            Track my order
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link to="/explore" className="btn btn--ghost">
            Continue shopping
          </Link>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => window.print()}
          >
            <Printer size={16} aria-hidden="true" />
            Print receipt
          </button>
        </div>
      </section>

      <OrderProgress status={order.status} />

      <div className="confirmation__grid">
        <div className="confirmation__main">
          <section className="info-card">
            <header className="info-card__head">
              <h2>Items</h2>
              <OrderStatusBadge status={order.status} />
            </header>
            <ul className="confirmation__items">
              {order.items.map((item, index) => (
                <li key={`${item.name}-${index}`}>
                  <SmartImage src={item.image} alt={item.name} ratio="square" fallbackLabel={item.name} />
                  <div>
                    <strong>{item.name}</strong>
                    <em>
                      <Store size={12} aria-hidden="true" /> {item.storeName} · Qty {item.quantity}
                    </em>
                  </div>
                  <span>{currency(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="info-card">
            <h2>Progress</h2>
            <OrderTimeline order={order} />
          </section>
        </div>

        <aside className="confirmation__side">
          <section className="info-card">
            <h2>Delivery</h2>
            <ul className="info-list">
              <li>
                <MapPin size={15} aria-hidden="true" />
                <span>
                  <strong>{order.deliveryAddress.recipient}</strong>
                  <em>
                    {order.deliveryAddress.line1}
                    {order.deliveryAddress.line2 ? `, ${order.deliveryAddress.line2}` : ""}
                    <br />
                    {order.deliveryAddress.city}, {order.deliveryAddress.state}{" "}
                    {order.deliveryAddress.zip}
                  </em>
                </span>
              </li>
              <li>
                {order.deliveryMethod === "Pickup" ? (
                  <Store size={15} aria-hidden="true" />
                ) : (
                  <Truck size={15} aria-hidden="true" />
                )}
                <span>
                  <strong>{order.deliveryMethod}</strong>
                  <em>
                    {order.deliveryAddress.instructions || "No special instructions"}
                  </em>
                </span>
              </li>
              <li>
                <CalendarClock size={15} aria-hidden="true" />
                <span>
                  <strong>Estimated soon</strong>
                  <em>Each seller sets their own estimate</em>
                </span>
              </li>
            </ul>
          </section>

          <section className="info-card">
            <h2>Payment</h2>
            <p className="confirmation__payment">
              <Package size={14} aria-hidden="true" />
              {order.payment.brand} ending {order.payment.last4} ·{" "}
              <span className="badge badge--brand-soft">Demo payment</span>
            </p>
            <p className="confirmation__muted">
              Reference {order.payment.reference}. This local build simulates payment — no funds moved.
            </p>
            <button
              type="button"
              className="link-plain"
              onClick={() => {
                navigator.clipboard
                  ?.writeText(order.orderNumber)
                  .then(() => toast.success("Order number copied", order.orderNumber))
                  .catch(() => undefined);
              }}
            >
              <Copy size={13} aria-hidden="true" /> Copy order number
            </button>
          </section>

          <section className="info-card">
            <h2>Total</h2>
            <div className="cart-summary__rows">
              <div>
                <span>Subtotal</span>
                <span>{currency(order.totals.subtotal)}</span>
              </div>
              {order.totals.discount > 0 ? (
                <div className="cart-summary__discount">
                  <span>Discount</span>
                  <span>-{currency(order.totals.discount)}</span>
                </div>
              ) : null}
              <div>
                <span>Tax</span>
                <span>{currency(order.totals.tax)}</span>
              </div>
              <div>
                <span>Service fee</span>
                <span>{currency(order.totals.serviceFee)}</span>
              </div>
              <div>
                <span>Delivery</span>
                <span>{currency(order.totals.deliveryFee)}</span>
              </div>
            </div>
            <div className="cart-summary__total">
              <span>Total</span>
              <strong>{currency(order.totals.total)}</strong>
            </div>
          </section>

          <Link to="/account" className="link-arrow">
            <Home size={15} aria-hidden="true" /> Back to my account
          </Link>
        </aside>
      </div>
    </div>
  );
}
