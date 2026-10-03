import { useState } from "react";
import { Search, Sparkles, TrendingUp, UserRound, Users } from "lucide-react";
import { sellerService } from "../../services/marketplace";
import { useAsync, useDebounced } from "../../hooks/useAsync";
import { currency, formatDateTime } from "../../utils/format";
import { PageHeader } from "../../components/common/SectionHeader";
import { Avatar } from "../../components/ui/SmartImage";
import { StatTile } from "../../components/ui/Rating";
import { EmptyState, RowsSkeleton } from "../../components/ui/Feedback";

type Customer = Awaited<ReturnType<typeof sellerService.customers>>["items"][number];

export default function SellerCustomersPage() {
  const [q, setQ] = useState("");
  const debouncedQ = useDebounced(q, 250);
  const { data, loading, error, reload } = useAsync(() => sellerService.customers(), []);
  const [selected, setSelected] = useState<Customer | null>(null);

  const customers = (data?.items ?? []).filter((customer) => {
    if (!debouncedQ.trim()) return true;
    const term = debouncedQ.trim().toLowerCase();
    return (
      customer.name.toLowerCase().includes(term) || customer.email.toLowerCase().includes(term)
    );
  });

  const summary = data?.summary;

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Relationships"
        title="Customers"
        description="Who buys from you on campus, how often, and what they are worth to your store."
      />

      {summary ? (
        <div className="stat-row stat-row--four">
          <StatTile
            label="All-time customers"
            value={summary.total}
            icon={<Users size={18} aria-hidden="true" />}
            tone="brand"
          />
          <StatTile
            label="Repeat buyers"
            value={`${summary.repeat}`}
            hint={
              summary.total
                ? `${Math.round((summary.repeat / summary.total) * 100)}% of your customers order again`
                : "—"
            }
            icon={<TrendingUp size={18} aria-hidden="true" />}
            tone="success"
          />
          <StatTile
            label="Average order value"
            value={currency(summary.averageOrderValue)}
            icon={<Sparkles size={18} aria-hidden="true" />}
          />
          <StatTile
            label="Lifetime value per customer"
            value={currency(summary.lifetimeValue)}
            hint="Across every order they have placed with you"
            icon={<UserRound size={18} aria-hidden="true" />}
          />
        </div>
      ) : null}

      <label className="field field--search field--block">
        <span className="sr-only">Search customers</span>
        <Search size={15} aria-hidden="true" />
        <input
          type="search"
          value={q}
          placeholder="Search by name or email"
          onChange={(event) => setQ(event.target.value)}
        />
      </label>

      {error ? <p className="form-alert">{error}</p> : null}
      {loading && !data ? <RowsSkeleton count={5} /> : null}

      {data && customers.length === 0 ? (
        <EmptyState
          icon={<Users size={26} aria-hidden="true" />}
          title={q ? "No customers match" : "No customers yet"}
          description={
            q
              ? "Try a different name or email."
              : "Customers appear here after their first order with your store."
          }
        />
      ) : null}

      {customers.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Customer</th>
                <th scope="col">Orders</th>
                <th scope="col">Total spend</th>
                <th scope="col">Average order</th>
                <th scope="col">Last order</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className={selected?.id === customer.id ? "is-selected" : undefined}
                  onClick={() => setSelected(customer)}
                >
                  <td>
                    <div className="table-person">
                      <Avatar src={customer.avatar} name={customer.name} size={34} />
                      <span>
                        <span className="table-strong">{customer.name}</span>
                        <span className="table-sub">{customer.email}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="table-strong">{customer.orders}</span>
                  </td>
                  <td>
                    <span className="table-strong">{currency(customer.spend)}</span>
                  </td>
                  <td>{currency(customer.averageOrderValue)}</td>
                  <td>
                    <span title={formatDateTime(customer.lastOrderAt)}>
                      {customer.lastOrderAt ? formatDateTime(customer.lastOrderAt) : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <button type="button" className="link-plain" onClick={reload}>
        Refresh customer list
      </button>
    </div>
  );
}
