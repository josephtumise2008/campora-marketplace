import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Boxes,
  CircleDollarSign,
  Clock3,
  MessageSquare,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { adminService } from "../../services/marketplace";
import type { AdminOverview } from "../../types";
import { useAsync } from "../../hooks/useAsync";
import { currency, cx, formatDateTime, numberCompact, relativeTime } from "../../utils/format";
import { PageHeader } from "../../components/common/SectionHeader";
import { StatTile } from "../../components/ui/Rating";
import { OrderStatusBadge } from "../../components/common/OrderBits";
import { SmartImage, StoreLogo } from "../../components/ui/SmartImage";
import { EmptyState, ErrorState, ProductGridSkeleton, RowsSkeleton } from "../../components/ui/Feedback";

function PlatformChart({ series }: { series: AdminOverview["series"] }) {
  const max = Math.max(...series.map((row) => row.revenue), 1);
  const total = series.reduce((sum, row) => sum + row.revenue, 0);
  const orders = series.reduce((sum, row) => sum + row.orders, 0);

  return (
    <div className="chart">
      <header className="chart__head">
        <div>
          <p className="chart__label">Marketplace volume · last 30 days</p>
          <p className="chart__value">{currency(total)}</p>
          <p className="chart__sub">
            {orders} orders · {currency(total / Math.max(orders, 1))} average
          </p>
        </div>
        <span className="chart__badge">
          <TrendingUp size={14} aria-hidden="true" /> {series.length} days
        </span>
      </header>
      <div
        className="chart__plot"
        role="img"
        aria-label={`Marketplace revenue over ${series.length} days totalling ${currency(total)}`}
      >
        {series.map((row, index) => (
          <span
            key={row.date}
            className="chart__bar"
            style={{ height: `${Math.max(3, (row.revenue / max) * 100)}%` }}
            title={`${row.date}: ${currency(row.revenue)} across ${row.orders} orders`}
          >
            {index % 5 === 0 ? <em className="chart__label-x">{row.date.slice(5)}</em> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, loading, error, reload } = useAsync<AdminOverview>(
    () => adminService.overview(),
    []
  );

  if (error) {
    return (
      <div className="stack-lg">
        <PageHeader eyebrow="Admin" title="Marketplace overview" />
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="stack-lg">
        <PageHeader eyebrow="Admin" title="Marketplace overview" />
        <ProductGridSkeleton count={4} />
        <RowsSkeleton count={3} />
      </div>
    );
  }

  if (!data) return null;

  const { stats, series, recentOrders, recentUsers, topStores, ordersByStatus, topCategories } = data;
  const needsVerification = stats.pendingStores;

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Admin console"
        title="Marketplace overview"
        description="Health of the Campora marketplace: who is here, what is selling, and what needs approving."
        actions={
          <>
            <Link to="/admin/reports" className="btn btn--ghost">
              Full reports
            </Link>
            <Link to="/admin/stores" className="btn btn--primary">
              Review stores
              {needsVerification ? <span className="btn__count">{needsVerification}</span> : null}
            </Link>
          </>
        }
      />

      {needsVerification > 0 ? (
        <p className="admin-alert" role="status">
          <AlertTriangle size={15} aria-hidden="true" />
          <span>
            <strong>
              {needsVerification} store{needsVerification === 1 ? "" : "s"}
            </strong>{" "}
            {needsVerification === 1 ? "is" : "are"} waiting for verification. Shops stay hidden from campus
            search until approved.
          </span>
          <Link to="/admin/stores?status=pending" className="link-arrow">
            Review now
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </p>
      ) : null}

      <div className="stat-row">
        <StatTile
          label="Gross merchandise value"
          value={currency(stats.revenue, { compact: true })}
          hint={`${currency(stats.platformFees)} in platform fees`}
          icon={<CircleDollarSign size={18} aria-hidden="true" />}
          tone="brand"
        />
        <StatTile
          label="Orders"
          value={numberCompact(stats.orders)}
          hint={`${currency(stats.averageOrderValue)} average order`}
          icon={<ShoppingBag size={18} aria-hidden="true" />}
        />
        <StatTile
          label="Customers"
          value={numberCompact(stats.customers)}
          hint={`${stats.sellers} sellers on campus`}
          icon={<Users size={18} aria-hidden="true" />}
        />
        <StatTile
          label="Stores"
          value={stats.stores}
          hint={`${stats.verifiedStores} verified · ${stats.pendingStores} pending`}
          icon={<Store size={18} aria-hidden="true" />}
          tone={stats.pendingStores ? "warning" : "success"}
        />
        <StatTile
          label="Products"
          value={numberCompact(stats.products)}
          hint="Live across all stores"
          icon={<Boxes size={18} aria-hidden="true" />}
        />
        <StatTile
          label="Reviews"
          value={numberCompact(stats.reviews)}
          hint="Keep quality signals healthy"
          icon={<MessageSquare size={18} aria-hidden="true" />}
        />
      </div>

      <div className="split-2 split-2--wide">
        <PlatformChart series={series} />

        <section className="panel">
          <header className="panel__head">
            <h2>Order pipeline</h2>
            <Link to="/admin/orders" className="link-arrow">
              All orders
            </Link>
          </header>
          <ul className="pipeline">
            {ordersByStatus.map((row) => {
              const total = ordersByStatus.reduce((sum, entry) => sum + entry.count, 0) || 1;
              const percent = Math.round((row.count / total) * 100);
              return (
                <li key={row._id}>
                  <div className="pipeline__head">
                    <OrderStatusBadge status={row._id as never} />
                    <span className="pipeline__count">
                      {row.count} · {percent}%
                    </span>
                  </div>
                  <span className="pipeline__track">
                    <span
                      className={cx(
                        "pipeline__fill",
                        row._id === "Cancelled" ? "pipeline__fill--danger" : "pipeline__fill--brand"
                      )}
                      style={{ width: `${Math.max(2, percent)}%` }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="split-2">
        <section className="panel">
          <header className="panel__head">
            <h2>Top stores by revenue</h2>
            <Link to="/admin/stores" className="link-arrow">
              Manage
            </Link>
          </header>
          {topStores.length === 0 ? (
            <p className="panel__text">No store revenue yet.</p>
          ) : (
            <ul className="rank-list">
              {topStores.map((store, index) => (
                <li key={store._id}>
                  <span className="rank-list__index">{index + 1}</span>
                  <StoreLogo logo={store.logo} name={store.name} size="sm" />
                  <span>
                    <Link to={`/stores/${store.slug}`}>{store.name}</Link>
                    <em>
                      {numberCompact(store.stats?.orders || 0)} orders ·{" "}
                      {store.rating?.average?.toFixed(1)} ★
                    </em>
                  </span>
                  <span className="rank-list__value">{currency(store.stats?.revenue || 0)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <header className="panel__head">
            <h2>Busiest categories</h2>
            <Link to="/admin/categories" className="link-arrow">
              Manage
            </Link>
          </header>
          {topCategories.length === 0 ? (
            <p className="panel__text">No category sales yet.</p>
          ) : (
            <ul className="category-bars">
              {topCategories.map((category) => {
                const max = Math.max(...topCategories.map((entry) => entry.count), 1);
                return (
                  <li key={category._id}>
                    <Link to={`/category/${category.slug}`}>{category.name}</Link>
                    <span className="category-bars__track">
                      <span
                        className="category-bars__fill"
                        style={{ width: `${Math.max(3, (category.count / max) * 100)}%` }}
                      />
                    </span>
                    <span className="category-bars__value">{numberCompact(category.count)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="split-2">
        <section className="panel">
          <header className="panel__head">
            <h2>Latest orders</h2>
            <Link to="/admin/orders" className="link-arrow">
              All orders
            </Link>
          </header>
          {recentOrders.length === 0 ? (
            <EmptyState icon={<ShoppingBag size={22} aria-hidden="true" />} title="No orders yet" />
          ) : (
            <ul className="compact-list">
              {recentOrders.map((order) => (
                <li key={order._id}>
                  <div>
                    <p className="compact-list__title">{order.orderNumber}</p>
                    <p className="compact-list__meta">
                      {relativeTime(order.placedAt)} ·{" "}
                      {typeof order.customer === "object" ? order.customer?.name : "Customer"}
                    </p>
                  </div>
                  <span className="compact-list__value">
                    {currency(order.totals?.total)}
                    <OrderStatusBadge status={order.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <header className="panel__head">
            <h2>Newest accounts</h2>
            <Link to="/admin/users" className="link-arrow">
              All users
            </Link>
          </header>
          {recentUsers.length === 0 ? (
            <EmptyState icon={<Users size={22} aria-hidden="true" />} title="No users yet" />
          ) : (
            <ul className="compact-list">
              {recentUsers.map((entry) => (
                <li key={entry.email}>
                  <div className="table-person">
                    <SmartImage src={entry.avatar} alt={entry.name} ratio="square" fallbackLabel={entry.name} />
                    <div>
                      <p className="compact-list__title">{entry.name}</p>
                      <p className="compact-list__meta">{entry.email}</p>
                    </div>
                  </div>
                  <span className="badge badge--neutral">{entry.role}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="panel panel--muted">
        <header className="panel__head">
          <h2>
            <BadgeCheck size={17} aria-hidden="true" /> Platform health
          </h2>
          <span className="chart__badge">
            <Wallet size={14} aria-hidden="true" /> Simulated payments
          </span>
        </header>
        <ul className="health-grid">
          <li>
            <Clock3 size={15} aria-hidden="true" />
            <div>
              <strong>Store approvals</strong>
              <span>{stats.pendingStores} pending review</span>
            </div>
          </li>
          <li>
            <BadgeCheck size={15} aria-hidden="true" />
            <div>
              <strong>Verification rate</strong>
              <span>
                {stats.stores
                  ? Math.round((stats.verifiedStores / stats.stores) * 100)
                  : 0}
                % of stores verified
              </span>
            </div>
          </li>
          <li>
            <TrendingUp size={15} aria-hidden="true" />
            <div>
              <strong>Fee capture</strong>
              <span>
                {currency(stats.platformFees)} of {currency(stats.revenue)} GMV
              </span>
            </div>
          </li>
          <li>
            <MessageSquare size={15} aria-hidden="true" />
            <div>
              <strong>Review volume</strong>
              <span>
                {numberCompact(stats.reviews)} reviews ·{" "}
                {formatDateTime(series[series.length - 1]?.date)}
              </span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  );
}
