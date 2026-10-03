import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, MessageSquare, Store, Truck, XCircle } from "lucide-react";
import { orderService } from "../../services/marketplace";
import type { Order } from "../../types";
import { useAsync } from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import { currency, formatDateTime, pluralize } from "../../utils/format";
import { Breadcrumbs } from "../../components/common/SectionHeader";
import { OrderProgress, OrderStatusBadge, OrderTimeline } from "../../components/common/OrderBits";
import { SmartImage } from "../../components/ui/SmartImage";
import { ErrorState, LoadingBlock, Spinner } from "../../components/ui/Feedback";

export default function AccountOrderDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [cancelling, setCancelling] = useState(false);
  const [note, setNote] = useState("");

  const { data, loading, error, reload, setData } = useAsync<Order>(
    () => orderService.one(id),
    [id]
  );

  const cancel = async () => {
    if (!data) return;
    setCancelling(true);
    try {
      const result = await orderService.cancel(data._id);
      setData(result.order);
      toast.success("Order cancelled", "Stock has been returned to the sellers.");
    } catch (err) {
      toast.error("We could not cancel that order", err instanceof Error ? err.message : undefined);
    } finally {
      setCancelling(false);
    }
  };

  if (loading && !data) {
    return <LoadingBlock label="Loading your order" />;
  }

  if (error || !data) {
    return (
      <>
        <ErrorState
          title="We could not load that order"
          message={error || undefined}
          onRetry={reload}
        />
        <Link to="/account/orders" className="btn btn--secondary">
          Back to orders
        </Link>
      </>
    );
  }

  const order = data;
  const canCancel = ["Pending", "Confirmed"].includes(order.status);

  return (
    <div className="stack-lg">
      <button type="button" className="link-plain" onClick={() => navigate("/account/orders")}>
        <ArrowLeft size={15} aria-hidden="true" /> All orders
      </button>

      <header className="order-detail__head">
        <div>
          <Breadcrumbs
            items={[
              { label: "My account", to: "/account" },
              { label: "Orders", to: "/account/orders" },
              { label: order.orderNumber },
            ]}
          />
          <h1 className="page-title">{order.orderNumber}</h1>
          <p className="page-description">
            Placed {formatDateTime(order.placedAt)} · {pluralize(order.items.length, "item")} ·{" "}
            {currency(order.totals?.total)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <OrderProgress status={order.status} />

      <section className="panel">
        <header className="panel__head">
          <h2>Items</h2>
        </header>
        <ul className="confirmation__items">
          {order.items.map((item, index) => (
            <li key={`${item.name}-${index}`}>
              <SmartImage src={item.image} alt={item.name} ratio="square" fallbackLabel={item.name} />
              <div>
                <strong>{item.name}</strong>
                <em>
                  <Store size={12} aria-hidden="true" /> {item.storeName} · Qty {item.quantity} ·{" "}
                  {currency(item.price)} each
                </em>
              </div>
              <span>{currency(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="split-2">
        <section className="panel">
          <header className="panel__head">
            <h2>Progress</h2>
          </header>
          <OrderTimeline order={order} />
          {canCancel ? (
            <div className="panel__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={cancel}
                disabled={cancelling}
              >
                {cancelling ? <Spinner size={15} /> : <XCircle size={15} aria-hidden="true" />}
                Cancel order
              </button>
            </div>
          ) : null}
        </section>

        <section className="panel">
          <header className="panel__head">
            <h2>Delivery</h2>
          </header>
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
                <em>{order.deliveryAddress.instructions || "No special instructions"}</em>
              </span>
            </li>
            {order.customerNote ? (
              <li>
                <MessageSquare size={15} aria-hidden="true" />
                <span>
                  <strong>Your note</strong>
                  <em>{order.customerNote}</em>
                </span>
              </li>
            ) : null}
          </ul>
        </section>
      </div>

      <section className="panel">
        <header className="panel__head">
          <h2>Total</h2>
        </header>
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
        <p className="form-note">
          Paid with a simulated {order.payment.brand} card ending {order.payment.last4} · reference{" "}
          {order.payment.reference}
        </p>
      </section>

      {!canCancel && !note ? (
        <label className="field">
          <span className="field__label">Report a problem with this order</span>
          <textarea
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Tell the seller what went wrong (missing item, wrong address…)"
            maxLength={400}
          />
        </label>
      ) : null}

      {note ? (
        <div className="panel panel--accent">
          <p>{note}</p>
          <p className="form-note">
            In this local demo your note is stored in the browser only — no message is sent to a seller.
          </p>
        </div>
      ) : null}
    </div>
  );
}
