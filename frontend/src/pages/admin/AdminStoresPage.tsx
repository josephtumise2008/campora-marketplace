import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BadgeCheck,
  Filter,
  Mail,
  MapPin,
  Search,
  ShieldAlert,
  Star,
  Store as StoreIcon,
} from "lucide-react";
import { adminService } from "../../services/marketplace";
import type { AdminStore } from "../../types";
import { useAsync, useDebounced } from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import { currency, cx, formatDate, numberCompact } from "../../utils/format";
import { PageHeader } from "../../components/common/SectionHeader";
import { Avatar, StoreLogo } from "../../components/ui/SmartImage";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState, RowsSkeleton, Spinner } from "../../components/ui/Feedback";

const VERIFICATIONS = [
  { value: "", label: "All stores" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "suspended", label: "Suspended" },
];

export default function AdminStoresPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminStore | null>(null);
  const [nextVerification, setNextVerification] = useState("verified");
  const [nextStatus, setNextStatus] = useState("active");
  const [featured, setFeatured] = useState(false);
  const [saving, setSaving] = useState(false);
  const debouncedQ = useDebounced(q, 300);

  const verification = params.get("verification") || "";

  const { data, loading, error, reload } = useAsync(
    () => adminService.stores({ q: debouncedQ, verification, page, limit: 12 }),
    [debouncedQ, verification, page]
  );

  const stores = data?.items ?? [];

  const open = (store: AdminStore) => {
    setSelected(store);
    setNextVerification(store.verification);
    setNextStatus(store.status);
    setFeatured(Boolean(store.featured));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await adminService.setStoreVerification(selected._id, {
        verification: nextVerification,
        status: nextStatus,
        featured,
      });
      toast.success(
        nextVerification === "verified" ? `${selected.name} is now verified` : `${selected.name} updated`,
        "The store page reflects this immediately."
      );
      setSelected(null);
      reload();
    } catch (err) {
      toast.error("We could not update that store", err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Marketplace"
        title="Stores"
        description="Verify new campus shops, pause policy breaches, and feature the stores students love."
      />

      <div className="filters-toolbar">
        <label className="field field--search">
          <span className="sr-only">Search stores</span>
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={q}
            placeholder="Store name"
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="field field--inline">
          <Filter size={15} aria-hidden="true" />
          <select
            value={verification}
            onChange={(event) => {
              const next = new URLSearchParams(params);
              if (event.target.value) next.set("verification", event.target.value);
              else next.delete("verification");
              setParams(next, { replace: true });
              setPage(1);
            }}
          >
            {VERIFICATIONS.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="form-alert">{error}</p> : null}
      {loading && !data ? <RowsSkeleton count={6} /> : null}

      {data && stores.length === 0 ? (
        <EmptyState
          icon={<StoreIcon size={26} aria-hidden="true" />}
          title="No stores match"
          description="Try another search or verification filter."
        />
      ) : null}

      {stores.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Store</th>
                <th scope="col">Owner</th>
                <th scope="col">Verification</th>
                <th scope="col">Status</th>
                <th scope="col">Rating</th>
                <th scope="col">Revenue</th>
                <th scope="col">Joined</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store._id}>
                  <td>
                    <div className="table-person">
                      <StoreLogo logo={store.logo} name={store.name} size="sm" />
                      <span>
                        <Link to={`/stores/${store.slug}`} className="table-strong">
                          {store.name}
                        </Link>
                        <span className="table-sub">
                          <MapPin size={11} aria-hidden="true" /> {store.location?.city || "—"}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="table-person">
                      <Avatar src={store.owner?.avatar} name={store.owner?.name} size={28} />
                      <span>
                        <span className="table-strong">{store.owner?.name || "—"}</span>
                        <span className="table-sub">
                          <Mail size={11} aria-hidden="true" /> {store.owner?.email}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={cx(
                        "badge",
                        store.verification === "verified"
                          ? "badge--success"
                          : store.verification === "suspended"
                            ? "badge--danger"
                            : "badge--warning"
                      )}
                    >
                      {store.verification === "verified" ? (
                        <BadgeCheck size={12} aria-hidden="true" />
                      ) : store.verification === "suspended" ? (
                        <ShieldAlert size={12} aria-hidden="true" />
                      ) : null}
                      {store.verification}
                    </span>
                    {store.featured ? <span className="badge badge--brand">Featured</span> : null}
                  </td>
                  <td>
                    <span
                      className={cx(
                        "badge",
                        store.status === "active"
                          ? "badge--success"
                          : store.status === "paused"
                            ? "badge--warning"
                            : "badge--neutral"
                      )}
                    >
                      {store.status}
                    </span>
                  </td>
                  <td>
                    <span className="table-person table-person--tight">
                      <Star size={13} aria-hidden="true" />
                      <span className="table-strong">{store.rating?.average?.toFixed(1) || "New"}</span>
                    </span>
                    <span className="table-sub">{numberCompact(store.rating?.count || 0)} reviews</span>
                  </td>
                  <td>
                    <span className="table-strong">{currency(store.stats?.revenue || 0)}</span>
                    <span className="table-sub">{numberCompact(store.stats?.orders || 0)} orders</span>
                  </td>
                  <td>{formatDate(store.createdAt)}</td>
                  <td className="table-actions">
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={() => open(store)}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {data ? <Pagination pagination={data.pagination} onChange={setPage} /> : null}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Manage ${selected.name}` : "Manage store"}
        description={selected ? `Owned by ${selected.owner?.name} · ${selected.owner?.email}` : undefined}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setSelected(null)}>
              Cancel
            </button>
            <button type="submit" form="store-form" className="btn btn--primary" disabled={saving}>
              {saving ? <Spinner size={15} /> : null}
              Save changes
            </button>
          </>
        }
      >
        {selected ? (
          <form id="store-form" className="form-stack" onSubmit={save}>
            <div className="form-grid">
              <label className="field">
                <span className="field__label">Verification</span>
                <select
                  value={nextVerification}
                  onChange={(event) => setNextVerification(event.target.value)}
                >
                  <option value="pending">Pending review</option>
                  <option value="verified">Verified</option>
                  <option value="suspended">Suspended</option>
                </select>
              </label>
              <label className="field">
                <span className="field__label">Store status</span>
                <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                </select>
              </label>
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={featured}
                onChange={(event) => setFeatured(event.target.checked)}
              />
              <span>Feature this store on the home page</span>
            </label>

            <div className="store-review">
              <p className="field__label">Review checklist</p>
              <ul>
                <li>Contact email and phone confirmed</li>
                <li>Delivery fees and minimum order look reasonable</li>
                <li>Policies (returns, delivery, substitutions) written out</li>
                <li>Catalogue is campus-appropriate and in stock</li>
              </ul>
              <p className="form-note">
                <ShieldAlert size={13} aria-hidden="true" /> Suspending a store hides it from search and
                blocks new orders, but keeps its data intact.
              </p>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
