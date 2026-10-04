import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock3,
  Package,
  Plus,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { sellerService } from "../../services/marketplace";
import type { Order, OrderStatus, SellerDashboard } from "../../types";
import { useAsync } from "../../hooks/useAsync";
import { useCountUp } from "../../hooks/useCountUp";
import { currency, cx, formatDate, numberCompact, nextOrderStatus, relativeTime } from "../../utils/format";
import { PageHeader } from "../../components/common/SectionHeader";
import { OrderStatusBadge } from "../../components/common/OrderBits";
import { SmartImage, StoreLogo } from "../../components/ui/SmartImage";
import { StatTile } from "../../components/ui/Rating";
import { EmptyState, ErrorState, ProductGridSkeleton, RowsSkeleton } from "../../components/ui/Feedback";
import { useToast } from "../../context/ToastContext";

function Trend({ value, suffix = "%" }: { value: number; suffix?: string }) {
  if (value === 0) return <span className="trend trend--flat">No change</span>;
  const up = value > 0;
  return (
    <span className={cx("trend", up ? "trend--up" : "trend--down")}>
      {up ? <ArrowUpRight size={13} aria-hidden="true" /> : <ArrowDownRight size={13} aria-hidden="true" />}
      {up ? "+" : ""}
      {value}
      {suffix} vs previous 30 days
    </span>
  );
}

/** Tweens a number into place; used for the tiles and the chart headline so a
 *  fresh dashboard reads as "live" rather than as a static table. */
function CountUp({
  value,
  format,
}: {
  value: number;
  format: (n: number) => string;
}) {
  const ref = useCountUp(value, format);
  return <span ref={ref}>{format(value)}</span>;
}

function RevenueChart({ series }: { series: SellerDashboard["series"] }) {
  const reduceMotion = useReducedMotion();
  const plotRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [plot, setPlot] = useState({ width: 0, height: 0 });

  const max = Math.max(...series.map((row) => row.revenue), 1);
  const total = series.reduce((sum, row) => sum + row.revenue, 0);
  const best = series.reduce((peak, row) => (row.revenue > peak.revenue ? row : peak), series[0]);
  const activeDays = series.filter((row) => row.revenue > 0).length;
  const orders = series.reduce((sum, row) => sum + row.orders, 0);

  /* Tick density follows the plot width, not the viewport: 30 bars in 280px
   * leaves ~9px per bar, so a label every fifth day would overlap its
   * neighbour. */
  useEffect(() => {
    const node = plotRef.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(([entry]) =>
      setPlot({ width: entry.contentRect.width, height: entry.contentRect.height })
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const { width: plotWidth, height: plotHeight } = plot;
  const tickEvery = plotWidth === 0 ? 5 : plotWidth < 320 ? 10 : plotWidth < 520 ? 7 : 5;

  const active = activeIndex === null ? null : series[activeIndex];
  /* Centre the tooltip over its bar, then clamp it inside the plot on both
   * axes: horizontally so the first/last bar cannot push it past the card
   * edge, vertically so a peak bar cannot lift it over the chart header. */
  const tooltip = (() => {
    if (!active || activeIndex === null || plotWidth === 0) return undefined;
    const barTop = (Math.max(3, (active.revenue / max) * 100) / 100) * plotHeight;
    return {
      left: Math.min(
        Math.max(((activeIndex + 0.5) / series.length) * plotWidth, 56),
        Math.max(plotWidth - 56, 56)
      ),
      bottom: Math.min(barTop + 10, Math.max(plotHeight - 34, 40)),
    };
  })();

  return (
    <div className="chart">
      <header className="chart__head">
        <div>
          <p className="chart__label">Revenue · last {series.length} days</p>
          <p className="chart__value">
            <CountUp value={total} format={(n) => currency(n)} />
          </p>
        </div>
        <div className="chart__meta">
          <span className="chart__badge">
            <TrendingUp size={14} aria-hidden="true" /> {activeDays} active days
          </span>
          <span className="chart__badge chart__badge--muted">
            <ShoppingBag size={14} aria-hidden="true" /> {orders} orders
          </span>
        </div>
      </header>

      <div
        className="chart__plot"
        ref={plotRef}
        role="img"
        aria-label={`Revenue over ${series.length} days, total ${currency(total)} from ${orders} orders. Best day ${currency(best.revenue)}.`}
        onMouseLeave={() => setActiveIndex(null)}
      >
        <span className="chart__axis" aria-hidden="true">
          <em>{currency(max, { compact: true })}</em>
        </span>

        {active && tooltip ? (
          <span
            className="chart__tip"
            style={{ left: tooltip.left, bottom: tooltip.bottom }}
            role="status"
            aria-live="polite"
          >
            <strong>{currency(active.revenue)}</strong>
            <em>
              {active.date.slice(5)} · {active.orders} order{active.orders === 1 ? "" : "s"}
            </em>
          </span>
        ) : null}

        {series.map((row, index) => (
          <button
            type="button"
            key={row.date}
            className={cx(
              "chart__col",
              row.revenue === 0 && "is-empty",
              activeIndex === index && "is-active"
            )}
            aria-label={`${row.date}: ${currency(row.revenue)} from ${row.orders} order${
              row.orders === 1 ? "" : "s"
            }`}
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex(null)}
            onClick={() => setActiveIndex(index)}
          >
            <motion.span
              className="chart__bar"
              style={{ height: `${Math.max(3, (row.revenue / max) * 100)}%` }}
              initial={reduceMotion ? false : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{
                duration: 0.55,
                ease: [0.16, 1, 0.3, 1],
                delay: Math.min(index * 0.012, 0.34),
              }}
            />
            {index % tickEvery === 0 || index === series.length - 1 ? (
              <em className="chart__label-x">{row.date.slice(5)}</em>
            ) : null}
          </button>
        ))}
      </div>

      <footer className="chart__foot">
        <span>
          Best day <strong>{best.date.slice(5)}</strong> · {currency(best.revenue)}
        </span>
        <span>
          Average <strong>{currency(total / Math.max(1, activeDays))}</strong> on active days
        </span>
      </footer>
    </div>
  );
}

export default function SellerDashboardPage() {
  const reduceMotion = useReducedMotion();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync<SellerDashboard>(
    () => sellerService.dashboard(),
    []
  );
  const [updating, setUpdating] = useState<string | null>(null);

  const advance = async (order: Order, status: OrderStatus) => {
    setUpdating(order._id);
    try {
      await sellerService.setOrderStatus(order._id, status);
      toast.success(`Order ${order.orderNumber} → ${status}`);
      reload();
    } catch (err) {
      toast.error("We could not update that order", err instanceof Error ? err.message : undefined);
    } finally {
      setUpdating(null);
    }
  };

  if (error) {
    return (
      <div className="stack-lg">
        <PageHeader title="Seller dashboard" />
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="stack-lg">
        <PageHeader title="Seller dashboard" />
        <ProductGridSkeleton count={4} />
        <RowsSkeleton count={3} />
      </div>
    );
  }

  if (!data) return null;

  const { store, stats, series, topProducts, lowStock, recentOrders, customers } = data;
  const pending = recentOrders.filter((order) => ["Pending", "Confirmed"].includes(order.status));

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Seller dashboard"
        title={store.name}
        description={`${store.stats?.products ?? topProducts.length} products · ${
          store.verification === "verified" ? "Verified campus store" : "Awaiting verification"
        }`}
        actions={
          <Link to={`/stores/${store.slug}`} className="btn btn--ghost">
            <Store size={16} aria-hidden="true" />
            View public store
          </Link>
        }
      />

      <motion.section
        className="seller-card"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="seller-card__cover">
          <SmartImage src={store.cover} alt="" ratio="wide" fallbackLabel="" />
        </div>
        <div className="seller-card__body">
          <StoreLogo logo={store.logo} name={store.name} size="lg" />
          <div className="seller-card__text">
            <p className="seller-card__eyebrow">
              {store.verification === "verified" ? (
                <>
                  <BadgeCheck size={14} aria-hidden="true" /> Verified campus store
                </>
              ) : (
                <>
                  <Clock3 size={14} aria-hidden="true" /> Awaiting verification
                </>
              )}
            </p>
            <h2 className="seller-card__name">{store.name}</h2>
            <p className="seller-card__tagline">{store.tagline}</p>
            <ul className="seller-card__chips">
              <li>
                <Star size={13} aria-hidden="true" /> {stats.rating.toFixed(1)} ·{" "}
                {numberCompact(stats.reviewCount)} reviews
              </li>
              <li>
                <Users size={13} aria-hidden="true" /> {stats.customers} customers
              </li>
              <li>
                <Package size={13} aria-hidden="true" /> {stats.products} live products
              </li>
            </ul>
          </div>
          <div className="seller-card__actions">
            <Link to="/seller/products/new" className="btn btn--primary">
              <Plus size={16} aria-hidden="true" /> Add product
            </Link>
            <Link to="/seller/store" className="btn btn--secondary">
              <Settings size={16} aria-hidden="true" /> Store settings
            </Link>
          </div>
        </div>
      </motion.section>

      <QuickActions />

      <div className="stat-row">
        <StatTile
          label="Revenue · 30 days"
          value={<CountUp value={stats.revenue30} format={(n) => currency(n, { compact: true })} />}
          hint={<Trend value={stats.revenueChange} />}
          icon={<Wallet size={18} aria-hidden="true" />}
          tone="brand"
        />
        <StatTile
          label="Orders · 30 days"
          value={<CountUp value={stats.orders30} format={(n) => Math.round(n).toLocaleString()} />}
          hint={<Trend value={stats.ordersChange} />}
          icon={<ShoppingBag size={18} aria-hidden="true" />}
        />
        <StatTile
          label="Average order"
          value={<CountUp value={stats.averageOrderValue} format={(n) => currency(n)} />}
          hint={`Previous ${currency(stats.averageOrderValuePrevious)}`}
          icon={<BarChart3 size={18} aria-hidden="true" />}
        />
        <StatTile
          label="Rating"
          value={`${stats.rating.toFixed(1)} ★`}
          hint={`${numberCompact(stats.reviewCount)} reviews · ${stats.repeatRate}% repeat`}
          icon={<Star size={18} aria-hidden="true" />}
          tone="success"
        />
        <StatTile
          label="Active customers"
          value={<CountUp value={stats.customers} format={(n) => Math.round(n).toLocaleString()} />}
          hint="Unique buyers, all time"
          icon={<Users size={18} aria-hidden="true" />}
        />
        <StatTile
          label="Products live"
          value={<CountUp value={stats.products} format={(n) => Math.round(n).toLocaleString()} />}
          hint={
            lowStock.length ? (
              <span className="stat-hint-warning">
                <AlertTriangle size={12} aria-hidden="true" /> {lowStock.length} low on stock
              </span>
            ) : (
              "Stock levels healthy"
            )
          }
          icon={<Package size={18} aria-hidden="true" />}
          tone={lowStock.length ? "warning" : "default"}
        />
      </div>

      <SetupChecklist
        products={stats.products}
        reviews={stats.reviewCount}
        orders={stats.orders30}
        cover={store.cover}
        logo={store.logo}
      />

      <div className="split-2 split-2--wide">
        <RevenueChart series={series} />

        <section className="panel">
          <header className="panel__head">
            <h2>Needs attention</h2>
            <Link to="/seller/products" className="link-arrow">
              All products
            </Link>
          </header>
          {lowStock.length === 0 ? (
            <p className="panel__callout">
              <CheckCircle2 size={14} aria-hidden="true" /> Every product is comfortably stocked.
            </p>
          ) : (
            <ul className="low-stock">
              {lowStock.map((product) => (
                <li key={product._id}>
                  <SmartImage
                    src={product.images?.[0]}
                    alt={product.name}
                    ratio="square"
                    fallbackLabel={product.name}
                  />
                  <span>
                    <strong>{product.name}</strong>
                    <em>{product.stock} left in stock</em>
                  </span>
                  <span className={cx("badge", product.stock <= 3 ? "badge--danger" : "badge--warning")}>
                    {product.stock}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="panel">
        <header className="panel__head">
          <h2>Recent orders</h2>
          <Link to="/seller/orders" className="link-arrow">
            All orders
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </header>

        {recentOrders.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={24} aria-hidden="true" />}
            title="No orders yet"
            description="Orders appear here the moment a student checks out."
            action={
              <Link to="/seller/products/new" className="btn btn--primary btn--sm">
                List your first product
              </Link>
            }
          />
        ) : (
          /* A real table on desktop so the columns line up; below 900px the
             same markup reflows into per-order cards via data-label. */
          <div className="order-table-wrap">
            <table className="order-table">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Placed</th>
                  <th scope="col">Total</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="sr-only">Advance</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const next = nextOrderStatus(order.status)[0];
                  return (
                    <tr key={order._id}>
                      <td data-label="Order">
                        <div className="order-cell">
                          <div className="order-row__thumbs">
                            {order.items.slice(0, 2).map((item, index) => (
                              <SmartImage
                                key={`${item.name}-${index}`}
                                src={item.image}
                                alt={item.name}
                                ratio="square"
                                fallbackLabel={item.name}
                              />
                            ))}
                          </div>
                          <div className="order-cell__text">
                            <p className="order-row__number">{order.orderNumber}</p>
                            <p className="order-row__stores">
                              {typeof order.customer === "object" ? order.customer?.name : "Customer"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td data-label="Placed">{relativeTime(order.placedAt)}</td>
                      <td data-label="Total" className="order-cell--total">
                        {currency(order.storeSubtotal ?? order.totals.total)}
                      </td>
                      <td data-label="Status">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="order-cell--action">
                        {next ? (
                          <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            onClick={() => advance(order, next)}
                            disabled={updating === order._id}
                          >
                            {updating === order._id ? "…" : next}
                          </button>
                        ) : (
                          <span className="muted-note">Complete</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pending.length > 0 ? (
          <p className="panel__callout">
            <Clock3 size={14} aria-hidden="true" /> {pending.length} order
            {pending.length === 1 ? "" : "s"} waiting on a status update. Fast responses improve your
            store rating.
          </p>
        ) : null}
      </section>

      <div className="split-2">
        <section className="panel">
          <header className="panel__head">
            <h2>Best sellers</h2>
            <Link to="/seller/products" className="link-arrow">
              Manage
            </Link>
          </header>
          {topProducts.length === 0 ? (
            <EmptyState
              icon={<Package size={24} aria-hidden="true" />}
              title="Nothing sold yet"
              description="Add a product with real photos from your phone — listings with photos get most of the first orders."
              action={
                <Link to="/seller/products/new" className="btn btn--primary btn--sm">
                  <Plus size={14} aria-hidden="true" /> Add product
                </Link>
              }
            />
          ) : (
            <ul className="rank-list">
              {topProducts.map((product, index) => (
                <li key={product._id}>
                  <span className="rank-list__index">{index + 1}</span>
                  <SmartImage
                    src={product.images?.[0]}
                    alt={product.name}
                    ratio="square"
                    fallbackLabel={product.name}
                  />
                  <span>
                    <strong>{product.name}</strong>
                    <em>
                      {product.soldCount || 0} sold · {currency(product.revenue)}
                    </em>
                  </span>
                  <span className={cx("badge", (product.stock || 0) <= 5 ? "badge--warning" : "badge--success")}>
                    {product.stock} in stock
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <header className="panel__head">
            <h2>Recent customers</h2>
            <Link to="/seller/customers" className="link-arrow">
              All customers
            </Link>
          </header>
          {customers.length === 0 ? (
            <EmptyState
              icon={<Users size={24} aria-hidden="true" />}
              title="No customers yet"
              description="Students who check out appear here with their order history."
              action={
                <Link to="/seller/products" className="btn btn--ghost btn--sm">
                  Browse my products
                </Link>
              }
            />
          ) : (
            <ul className="customer-list">
              {customers.map((customer) => (
                <li key={customer.id}>
                  <SmartImage
                    src={customer.avatar}
                    alt={customer.name}
                    ratio="square"
                    fallbackLabel={customer.name}
                  />
                  <span>
                    <strong>{customer.name}</strong>
                    <em>{customer.email}</em>
                  </span>
                  <span>
                    <strong>{customer.orders}</strong>
                    <em>{currency(customer.spend)}</em>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="panel__text panel__text--muted">
            Last updated {formatDate(new Date().toISOString())} · refresh the page for live numbers.
          </p>
        </section>
      </div>

      <motion.div
        className="seller-tip"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <TrendingUp size={18} aria-hidden="true" />
        <p>
          <strong>Quick tip:</strong> stores that keep stock above 10 and respond to orders within an
          hour get more repeat buyers on campus.
        </p>
      </motion.div>
    </div>
  );
}

/** Shortcut strip so the workspace never feels like a wall of numbers. */
function QuickActions() {
  const actions = [
    {
      to: "/seller/products/new",
      label: "New product",
      text: "List something in a couple of minutes",
      icon: <Plus size={18} aria-hidden="true" />,
    },
    {
      to: "/seller/orders",
      label: "Ship an order",
      text: "Confirm, pack and hand it over",
      icon: <ShoppingBag size={18} aria-hidden="true" />,
    },
    {
      to: "/seller/store",
      label: "Refresh photos",
      text: "Upload new shots from your phone",
      icon: <Camera size={18} aria-hidden="true" />,
    },
    {
      to: "/seller/customers",
      label: "Your customers",
      text: "See who keeps coming back",
      icon: <Users size={18} aria-hidden="true" />,
    },
  ];

  return (
    <section className="quick-actions" aria-label="Seller shortcuts">
      <p className="quick-actions__label">
        <Sparkles size={14} aria-hidden="true" /> Quick actions
      </p>
      <div className="quick-actions__grid">
        {actions.map((action) => (
          <Link key={action.to} to={action.to} className="quick-action">
            <span className="quick-action__icon">{action.icon}</span>
            <span>
              <strong>{action.label}</strong>
              <em>{action.text}</em>
            </span>
            <ArrowRight size={16} aria-hidden="true" className="quick-action__go" />
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Onboarding checklist — keeps a fresh store from looking like a dead dashboard. */
function SetupChecklist({
  products,
  reviews,
  orders,
  cover,
  logo,
}: {
  products: number;
  reviews: number;
  orders: number;
  cover: string;
  logo: string;
}) {
  const steps = [
    {
      label: "Upload your store logo",
      text: "A photo from your phone is perfect.",
      done: Boolean(logo),
      to: "/seller/store",
    },
    {
      label: "Add a cover photo",
      text: "Wide banner, roughly 3:1.",
      done: Boolean(cover),
      to: "/seller/store",
    },
    {
      label: "List your first 3 products",
      text: "Clear photos sell faster than long descriptions.",
      done: products >= 3,
      to: "/seller/products/new",
    },
    {
      label: "Take your first order",
      text: "Confirm, pack and mark it shipped.",
      done: orders > 0,
      to: "/seller/orders",
    },
    {
      label: "Collect a review",
      text: "Reviews lift your store on Explore.",
      done: reviews > 0,
      to: "/seller/products",
    },
  ];
  const done = steps.filter((step) => step.done).length;
  if (done === steps.length) return null;

  const percent = Math.round((done / steps.length) * 100);

  return (
    <section className="panel checklist">
      <header className="panel__head">
        <div>
          <h2>Finish setting up your store</h2>
          <p className="panel__text">
            {done} of {steps.length} done — verified sellers with photos get more orders.
          </p>
        </div>
        <span className="checklist__progress" aria-label={`${percent}% complete`}>
          <strong>{percent}%</strong>
          <span className="checklist__bar">
            <span style={{ width: `${percent}%` }} />
          </span>
        </span>
      </header>
      <ul className="checklist__items">
        {steps.map((step) => (
          <li key={step.label} className={cx("checklist__item", step.done && "is-done")}>
            <span className="checklist__mark" aria-hidden="true">
              {step.done ? <CheckCircle2 size={18} /> : <span className="checklist__dot" />}
            </span>
            <span className="checklist__text">
              <strong>{step.label}</strong>
              <em>{step.text}</em>
            </span>
            <Link to={step.to} className={cx("btn btn--sm", step.done ? "btn--ghost" : "btn--secondary")}>
              {step.done ? "Review" : "Do it"}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
