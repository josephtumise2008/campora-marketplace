import { useState } from "react";
import { Filter, Info, Search, ShoppingBag } from "lucide-react";
import { adminService } from "../../services/marketplace";
import type { Order, OrderStatus } from "../../types";
import { useAsync, useDebounced } from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import { currency, formatDateTime, ORDER_STATUS_ORDER, relativeTime } from "../../utils/format";
import { PageHeader } from "../../components/common/SectionHeader";
import { OrderStatusBadge, OrderTimeline } from "../../components/common/OrderBits";
import { SmartImage } from "../../components/ui/SmartImage";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState, RowsSkeleton } from "../../components/ui/Feedback";

export default function AdminOrdersPage() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Order | null>(null);
  const debouncedQ = useDebounced(q, 300);

  const { data, loading, error, reload } = useAsync(
    () => adminService.orders({ q: debouncedQ, status, page, limit: 12 }),
    [debouncedQ, status, page]
  );

  const orders = data?.items ?? [];

  const override = async (order: Order, next: OrderStatus) => {
    try {
      await adminService.setOrderStatus(order._id, next);
      toast.success(`${order.orderNumber} → ${next}`, "Seller and customer views update instantly.");
      setOpen({ ...order, status: next });
      reload();
    } catch (err) {
      toast.error("We could not update that order", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Commerce"
        title="Orders"
        description="Every order on Campora. Use status overrides only when a seller needs support."
      />

      <div className="filters-toolbar">
        <label className="field field--search">
          <span className="sr-only">Search orders</span>
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={q}
            placeholder="Order number"
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="field field--inline">
          <Filter size={15} aria-hidden="true" />
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {ORDER_STATUS_ORDER.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="form-alert">{error}</p> : null}
      {loading && !data ? <RowsSkeleton count={7} /> : null}

      {data && orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={26} aria-hidden="true" />}
          title="No orders match"
          description="Try another order number or status."
        />
      ) : null}

      {orders.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Customer</th>
                <th scope="col">Items</th>
                <th scope="col">Total</th>
                <th scope="col">Fees</th>
                <th scope="col">Payment</th>
                <th scope="col">Status</th>
                <th scope="col">Placed</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <button
                      type="button"
                      className="link-plain link-plain--strong"
                      onClick={() => setOpen(order)}
                    >
                      {order.orderNumber}
                    </button>
                  </td>
                  <td>
                    <span className="table-strong">
                      {typeof order.customer === "object" ? order.customer?.name : "Customer"}
                    </span>
                    <span className="table-sub">
                      {typeof order.customer === "object" ? order.customer?.email : ""}
                    </span>
                  </td>
                  <td>
                    <div className="table-items">
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
                  </td>
                  <td>
                    <span className="table-strong">{currency(order.totals?.total)}</span>
                    <span className="table-sub">{order.items.length} item(s)</span>
                  </td>
                  <td>
                    <span className="table-strong">{currency(order.totals?.serviceFee)}</span>
                    <span className="table-sub">tax {currency(order.totals?.tax)}</span>
                  </td>
                  <td>
                    <span className="table-sub">
                      {order.payment?.brand} ···· {order.payment?.last4}
                    </span>
                    <span className="table-sub">{order.payment?.status}</span>
                  </td>
                  <td>
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td title={formatDateTime(order.placedAt)}>{relativeTime(order.placedAt)}</td>
                  <td className="table-actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => setOpen(order)}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {data ? <Pagination pagination={data.pagination} onChange={setPage} /> : null}

      <p className="form-note">
        <Info size={13} aria-hidden="true" /> Admin overrides are logged for the seller and the customer.
        Payments in this build are simulated, so no money ever moves.
      </p>

      <Modal
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open ? `Order ${open.orderNumber}` : "Order"}
        description={open ? `Placed ${formatDateTime(open.placedAt)}` : undefined}
        footer={
          open ? (
            <>
              <button type="button" className="btn btn--ghost" onClick={() => setOpen(null)}>
                Close
              </button>
              {ORDER_STATUS_ORDER[ORDER_STATUS_ORDER.indexOf(open.status) + 1] ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() =>
                    override(
                      open,
                      ORDER_STATUS_ORDER[ORDER_STATUS_ORDER.indexOf(open.status) + 1]
                    )
                  }
                >
                  Set {ORDER_STATUS_ORDER[ORDER_STATUS_ORDER.indexOf(open.status) + 1]}
                </button>
              ) : null}
              {open.status !== "Cancelled" ? (
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={() => override(open, "Cancelled")}
                >
                  Cancel order
                </button>
              ) : null}
            </>
          ) : null
        }
      >
        {open ? (
          <div className="stack-md">
            <ul className="order-detail__items">
              {open.items.map((item, index) => (
                <li key={`${item.name}-${index}`}>
                  <SmartImage
                    src={item.image}
                    alt={item.name}
                    ratio="square"
                    fallbackLabel={item.name}
                  />
                  <div>
                    <p className="order-detail__item-name">{item.name}</p>
                    <p className="order-detail__item-meta">
                      {item.storeName} · {currency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <span className="order-detail__item-total">
                    {currency(item.lineTotal ?? item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="order-detail__grid">
              <div>
                <p className="field__label">Totals</p>
                <p className="order-detail__address">
                  Subtotal {currency(open.totals?.subtotal)}
                  <br />
                  Service fee {currency(open.totals?.serviceFee)}
                  <br />
                  Tax {currency(open.totals?.tax)}
                  <br />
                  Delivery {currency(open.totals?.deliveryFee)}
                  <br />
                  <strong>Total {currency(open.totals?.total)}</strong>
                </p>
              </div>
              <div>
                <p className="field__label">Delivery</p>
                <p className="order-detail__address">
                  {open.deliveryAddress?.recipient}
                  <br />
                  {open.deliveryAddress?.line1}
                  <br />
                  {open.deliveryAddress?.city}, {open.deliveryAddress?.state}{" "}
                  {open.deliveryAddress?.zip}
                  <br />
                  {open.deliveryMethod}
                </p>
              </div>
            </div>

            <OrderTimeline order={open} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
