import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ClipboardList,
  Filter,
  Info,
  Package,
  Search,
  Truck,
} from "lucide-react";
import { sellerService } from "../../services/marketplace";
import type { Order, OrderStatus } from "../../types";
import { useAsync, useDebounced } from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import { currency, cx, formatDateTime, ORDER_STATUS_ORDER, relativeTime } from "../../utils/format";
import { PageHeader } from "../../components/common/SectionHeader";
import { OrderStatusBadge, OrderTimeline } from "../../components/common/OrderBits";
import { SmartImage } from "../../components/ui/SmartImage";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState, RowsSkeleton, Spinner } from "../../components/ui/Feedback";

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All orders" },
  ...ORDER_STATUS_ORDER.map((status) => ({ value: status, label: status })),
];

export default function SellerOrdersPage() {
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Order | null>(null);
  const [updating, setUpdating] = useState<OrderStatus | null>(null);
  const debouncedQ = useDebounced(q, 300);

  const { data, loading, error, reload } = useAsync(
    () => sellerService.orders({ status, q: debouncedQ, page, limit: 10 }),
    [status, debouncedQ, page]
  );

  const orders = data?.items ?? [];

  const changeStatus = async (order: Order, next: OrderStatus) => {
    setUpdating(next);
    try {
      await sellerService.setOrderStatus(order._id, next);
      toast.success(`Order ${order.orderNumber} → ${next}`);
      if (open?._id === order._id) {
        setOpen({ ...order, status: next });
      }
      reload();
    } catch (err) {
      toast.error("We could not update that order", err instanceof Error ? err.message : undefined);
    } finally {
      setUpdating(null);
    }
  };

  const countFor = (value: string) => {
    if (value === "") return data?.pagination.total ?? 0;
    return undefined;
  };

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Fulfilment"
        title="Orders"
        description="Keep students informed. Each status change appears in their account and notifications."
        actions={
          <Link to="/seller/products" className="btn btn--ghost">
            <Package size={15} aria-hidden="true" />
            Stock check
          </Link>
        }
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
            {FILTERS.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
                {countFor(entry.value) !== undefined ? ` (${countFor(entry.value)})` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="form-alert">{error}</p> : null}
      {loading && !data ? <RowsSkeleton count={5} /> : null}

      {data && orders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={26} aria-hidden="true" />}
          title={status || q ? "No orders match" : "No orders yet"}
          description={
            status || q
              ? "Try another status or clear the order number."
              : "When a student checks out, their order lands here instantly."
          }
          action={
            <Link to="/seller/products" className="btn btn--primary">
              Review my catalogue
            </Link>
          }
        />
      ) : null}

      {orders.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Items</th>
                <th scope="col">Customer</th>
                <th scope="col">Total</th>
                <th scope="col">Status</th>
                <th scope="col">Placed</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const name =
                  typeof order.customer === "object" ? order.customer?.name : "Customer";
                const next = ORDER_STATUS_ORDER[ORDER_STATUS_ORDER.indexOf(order.status) + 1];
                return (
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
                        {order.items.length > 3 ? (
                          <span className="table-items__more">+{order.items.length - 3}</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <span className="table-strong">{name}</span>
                      <span className="table-sub">{order.deliveryAddress?.city}</span>
                    </td>
                    <td>
                      <span className="table-strong">
                        {currency(order.storeSubtotal ?? order.totals?.total)}
                      </span>
                    </td>
                    <td>
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td>
                      <span title={formatDateTime(order.placedAt)}>{relativeTime(order.placedAt)}</span>
                    </td>
                    <td className="table-actions">
                      {next ? (
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          onClick={() => changeStatus(order, next)}
                          disabled={updating === next}
                        >
                          {updating === next ? "…" : next}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => setOpen(order)}
                        aria-label={`Open order ${order.orderNumber}`}
                      >
                        <ArrowRight size={15} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {data ? <Pagination pagination={data.pagination} onChange={setPage} /> : null}

      <p className="form-note">
        <Info size={13} aria-hidden="true" /> Statuses flow in order:{" "}
        {ORDER_STATUS_ORDER.join(" → ")}. Cancelling keeps the order visible for your records.
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
                    changeStatus(
                      open,
                      ORDER_STATUS_ORDER[ORDER_STATUS_ORDER.indexOf(open.status) + 1]
                    )
                  }
                  disabled={updating !== null}
                >
                  {updating ? (
                    <Spinner size={15} />
                  ) : (
                    <Truck size={15} aria-hidden="true" />
                  )}
                  Mark as {ORDER_STATUS_ORDER[ORDER_STATUS_ORDER.indexOf(open.status) + 1]}
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
                  <span className={cx("order-detail__item-total")}>
                    {currency(item.lineTotal ?? item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="order-detail__grid">
              <div>
                <p className="field__label">Deliver to</p>
                <p className="order-detail__address">
                  {open.deliveryAddress?.recipient}
                  <br />
                  {open.deliveryAddress?.line1}
                  {open.deliveryAddress?.line2 ? `, ${open.deliveryAddress.line2}` : ""}
                  <br />
                  {open.deliveryAddress?.city}, {open.deliveryAddress?.state}{" "}
                  {open.deliveryAddress?.zip}
                </p>
                {open.deliveryAddress?.instructions ? (
                  <p className="order-detail__note">“{open.deliveryAddress.instructions}”</p>
                ) : null}
              </div>
              <div>
                <p className="field__label">Payment</p>
                <p className="order-detail__address">
                  {open.payment?.brand} ···· {open.payment?.last4}
                  <br />
                  {open.deliveryMethod} delivery
                </p>
                <p className="order-detail__note">Simulated demo payment</p>
              </div>
            </div>

            {open.customerNote ? (
              <p className="order-detail__note">
                <strong>Customer note:</strong> {open.customerNote}
              </p>
            ) : null}

            <OrderTimeline order={open} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
