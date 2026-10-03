import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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

function RevenueChart({ series }: { series: SellerDashboard["series"] }) {
  const max = Math.max(...series.map((row) => row.revenue), 1);
  const total = series.reduce((sum, row) => sum + row.revenue, 0);

  const best = series.reduce((peak, row) => (row.revenue > peak.revenue ? row : peak), series[0]);
  const activeDays = series.filter((row) => row.revenue > 0).length;
  const orders = series.reduce((sum, row) => sum + row.orders, 0);

  return (
    <div className="chart">
      <header className="chart__head">
        <div>
          <p className="chart__label">Revenue · last {series.length} days</p>
          <p className="chart__value">{currency(total)}</p>
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
        role="img"
        aria-label={`Revenue over ${series.length} days, total ${currency(total)} from ${orders} orders. Best day ${currency(best.revenue)}.`}
      >
        <span className="chart__axis" aria-hidden="true">
          <em>{currency(max, { compact: true })}</em>
        </span>
        {series.map((row, index) => (
          <span
            key={row.date}
            className={cx("chart__col", row.revenue === 0 && "is-empty")}
            title={`${row.date}: ${currency(row.revenue)} from ${row.orders} order(s)`}
          >
            <span className="chart__bar" style={{ height: `${Math.max(3, (row.revenue / max) * 100)}%` }}>
              {index === series.length - 1 ? <em className="chart__value-x">{currency(row.revenue, { compact: true })}</em> : null}
            </span>
            {index % 5 === 0 ? <em className="chart__label-x">{row.date.slice(5)}</em> : null}
          </span>
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
          <>
            <Link to={`/stores/${store.slug}`} className="btn btn--ghost">
              <Store size={16} aria-hidden="true" />
              View public store
            </Link>
            <Link to="/seller/products/new" className="btn btn--primary">
              <Plus size={16} aria-hidden="true" />
              Add product
            </Link>
          </>
        }
      />

      <section className="store-hero">
        <div className="store-hero__cover">
          <SmartImage src={store.cover} alt="" ratio="wide" fallbackLabel="" />
        </div>
        <div className="store-hero__body">
          <StoreLogo logo={store.logo} name={store.name} size="lg" />
          <div className="store-hero__text">
            <p className="store-hero__eyebrow">
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
            <h2 className="store-hero__name">{store.name}</h2>
            <p className="store-hero__tagline">{store.tagline}</p>
            <ul className="store-hero__chips">
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
          <div className="store-hero__actions">
            <Link to="/seller/products/new" className="btn btn--primary">
              <Plus size={16} aria-hidden="true" /> Add product
            </Link>
            <Link to="/seller/products/new" className="btn btn--secondary">
              <Camera size={16} aria-hidden="true" /> Upload photos
            </Link>
            <Link to="/seller/store" className="btn btn--ghost btn--sm">
              <Settings size={15} aria-hidden="true" /> Store settings
            </Link>
          </div>
        </div>
      </section>

      <QuickActions />

      <div className="stat-row">
        <StatTile
          label="Revenue · 30 days"
          value={currency(stats.revenue30, { compact: true })}
          hint={<Trend value={stats.revenueChange} />}
          icon={<Wallet size={18} aria-hidden="true" />}
          tone="brand"
        />
        <StatTile
          label="Orders · 30 days"
          value={stats.orders30}
          hint={<Trend value={stats.ordersChange} />}
          icon={<ShoppingBag size={18} aria-hidden="true" />}
        />
        <StatTile
          label="Average order"
          value={currency(stats.averageOrderValue)}
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
          value={stats.customers}
          hint="Unique buyers, all time"
          icon={<Users size={18} aria-hidden="true" />}
        />
        <StatTile
          label="Products live"
          value={stats.products}
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
          <ul className="order-list">
            {recentOrders.map((order) => {
              const next = nextOrderStatus(order.status)[0];
              return (
                <li key={order._id} className="order-row">
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
                  <div className="order-row__info">
                    <p className="order-row__number">{order.orderNumber}</p>
                    <p className="order-row__meta">
                      {relativeTime(order.placedAt)} · {currency(order.storeSubtotal ?? order.totals.total)}
                    </p>
                    <p className="order-row__stores">
                      {typeof order.customer === "object" ? order.customer?.name : "Customer"}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
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
                </li>
              );
            })}
          </ul>
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
