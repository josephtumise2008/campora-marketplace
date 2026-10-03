import { BarChart3, Download, Package, Store, TrendingUp, Wallet } from "lucide-react";
import { adminService } from "../../services/marketplace";
import type { AdminReports } from "../../types";
import { useAsync } from "../../hooks/useAsync";
import { currency, cx, numberCompact } from "../../utils/format";
import { PageHeader } from "../../components/common/SectionHeader";
import { StatTile } from "../../components/ui/Rating";
import { SmartImage, StoreLogo } from "../../components/ui/SmartImage";
import { ErrorState, ProductGridSkeleton, RowsSkeleton } from "../../components/ui/Feedback";

function RevenueBars({ series }: { series: AdminReports["revenueByDay"] }) {
  const sorted = [...series].sort((a, b) => a._id.localeCompare(b._id));
  const max = Math.max(...sorted.map((row) => row.revenue), 1);
  const total = sorted.reduce((sum, row) => sum + row.revenue, 0);

  return (
    <div className="chart">
      <header className="chart__head">
        <div>
          <p className="chart__label">Revenue by day</p>
          <p className="chart__value">{currency(total)}</p>
          <p className="chart__sub">
            {sorted.length} trading day{sorted.length === 1 ? "" : "s"} with sales
          </p>
        </div>
        <span className="chart__badge">
          <TrendingUp size={14} aria-hidden="true" /> {numberCompact(sorted.length)} days
        </span>
      </header>
      <div
        className="chart__plot chart__plot--dense"
        role="img"
        aria-label={`Daily revenue for ${sorted.length} days totalling ${currency(total)}`}
      >
        {sorted.map((row, index) => (
          <span
            key={row._id}
            className="chart__bar"
            style={{ height: `${Math.max(2, (row.revenue / max) * 100)}%` }}
            title={`${row._id}: ${currency(row.revenue)}`}
          >
            {index % 7 === 0 ? <em className="chart__label-x">{row._id.slice(5)}</em> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

function toCsv(rows: (string | number)[][], name: string) {
  const body = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AdminReportsPage() {
  const { data, loading, error, reload } = useAsync<AdminReports>(() => adminService.reports(), []);

  if (error) {
    return (
      <div className="stack-lg">
        <PageHeader eyebrow="Admin" title="Reports" />
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="stack-lg">
        <PageHeader eyebrow="Admin" title="Reports" />
        <ProductGridSkeleton count={4} />
        <RowsSkeleton count={4} />
      </div>
    );
  }

  if (!data) return null;

  const categoryRevenue = data.categoryBreakdown.reduce(
    (sum, row) => sum + row.units * row.averagePrice,
    0
  );
  const storeRevenue = data.storePerformance.reduce((sum, row) => sum + row.revenue, 0);
  const statusRevenue = data.statusBreakdown.reduce((sum, row) => sum + row.total, 0);
  const units = data.categoryBreakdown.reduce((sum, row) => sum + row.units, 0);
  const bestCategory = data.categoryBreakdown[0];
  const bestStore = [...data.storePerformance].sort((a, b) => b.revenue - a.revenue)[0];

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Admin"
        title="Reports"
        description="Category demand, store performance and the order status mix. Export any table as CSV."
        actions={
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() =>
              toCsv(
                [
                  ["Store", "Orders", "Revenue", "Verification"],
                  ...data.storePerformance.map((row) => [
                    row.name,
                    row.orders,
                    row.revenue,
                    row.verification,
                  ]),
                ],
                "campora-store-performance.csv"
              )
            }
          >
            <Download size={15} aria-hidden="true" />
            Export stores
          </button>
        }
      />

      <div className="stat-row stat-row--four">
        <StatTile
          label="Units sold"
          value={numberCompact(units)}
          hint={`${data.categoryBreakdown.length} active categories`}
          icon={<Package size={18} aria-hidden="true" />}
        />
        <StatTile
          label="Category revenue"
          value={currency(categoryRevenue, { compact: true })}
          hint={bestCategory ? `Led by ${bestCategory.name}` : "—"}
          icon={<BarChart3 size={18} aria-hidden="true" />}
          tone="brand"
        />
        <StatTile
          label="Store revenue"
          value={currency(storeRevenue, { compact: true })}
          hint={bestStore ? `Led by ${bestStore.name}` : "—"}
          icon={<Store size={18} aria-hidden="true" />}
          tone="success"
        />
        <StatTile
          label="Order value"
          value={currency(statusRevenue, { compact: true })}
          hint="All statuses combined"
          icon={<Wallet size={18} aria-hidden="true" />}
        />
      </div>

      <RevenueBars series={data.revenueByDay} />

      <section className="panel">
        <header className="panel__head">
          <h2>Category demand</h2>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() =>
              toCsv(
                [
                  ["Category", "Slug", "Products", "Units sold", "Average price"],
                  ...data.categoryBreakdown.map((row) => [
                    row.name,
                    row.slug,
                    row.products,
                    row.units,
                    row.averagePrice,
                  ]),
                ],
                "campora-category-demand.csv"
              )
            }
          >
            <Download size={14} aria-hidden="true" />
            CSV
          </button>
        </header>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Products</th>
                <th scope="col">Units sold</th>
                <th scope="col">Average price</th>
                <th scope="col">Estimated revenue</th>
                <th scope="col">Share</th>
              </tr>
            </thead>
            <tbody>
              {data.categoryBreakdown.map((row) => {
                const revenue = row.units * row.averagePrice;
                const share = categoryRevenue ? Math.round((revenue / categoryRevenue) * 100) : 0;
                return (
                  <tr key={row.slug}>
                    <td>
                      <span className="table-strong">{row.name}</span>
                      <span className="table-sub">/{row.slug}</span>
                    </td>
                    <td>{row.products}</td>
                    <td>
                      <span className="table-strong">{numberCompact(row.units)}</span>
                    </td>
                    <td>{currency(row.averagePrice)}</td>
                    <td>
                      <span className="table-strong">{currency(revenue)}</span>
                    </td>
                    <td>
                      <span className="share-bar">
                        <span
                          className={cx("share-bar__fill", share > 20 && "share-bar__fill--hot")}
                          style={{ width: `${Math.max(2, share)}%` }}
                        />
                        <em>{share}%</em>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <header className="panel__head">
          <h2>Store performance</h2>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() =>
              toCsv(
                [
                  ["Store", "Slug", "Verification", "Orders", "Revenue"],
                  ...data.storePerformance.map((row) => [
                    row.name,
                    row.slug,
                    row.verification,
                    row.orders,
                    row.revenue,
                  ]),
                ],
                "campora-store-performance.csv"
              )
            }
          >
            <Download size={14} aria-hidden="true" />
            CSV
          </button>
        </header>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Store</th>
                <th scope="col">Verification</th>
                <th scope="col">Orders</th>
                <th scope="col">Revenue</th>
                <th scope="col">Average order</th>
              </tr>
            </thead>
            <tbody>
              {data.storePerformance.map((row) => (
                <tr key={row.slug}>
                  <td>
                    <div className="table-person">
                      <StoreLogo logo={row.logo} name={row.name} size="sm" />
                      <span className="table-strong">{row.name}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={cx(
                        "badge",
                        row.verification === "verified" ? "badge--success" : "badge--warning"
                      )}
                    >
                      {row.verification}
                    </span>
                  </td>
                  <td>{row.orders}</td>
                  <td>
                    <span className="table-strong">{currency(row.revenue)}</span>
                  </td>
                  <td>{currency(row.orders ? row.revenue / row.orders : 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="split-2">
        <section className="panel">
          <header className="panel__head">
            <h2>Best sellers</h2>
          </header>
          <ul className="rank-list">
            {data.topSellers.map((product, index) => (
              <li key={`${product.name}-${index}`}>
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
                    {product.store?.name} · {numberCompact(product.soldCount)} sold
                  </em>
                </span>
                <span className="rank-list__value">{currency(product.price)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <header className="panel__head">
            <h2>Status mix</h2>
          </header>
          <ul className="pipeline">
            {data.statusBreakdown.map((row) => {
              const total = data.statusBreakdown.reduce((sum, entry) => sum + entry.count, 0) || 1;
              const percent = Math.round((row.count / total) * 100);
              return (
                <li key={row._id}>
                  <div className="pipeline__head">
                    <span className="table-strong">{row._id}</span>
                    <span className="pipeline__count">
                      {row.count} · {currency(row.total)}
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
    </div>
  );
}
