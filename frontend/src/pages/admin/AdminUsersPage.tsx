import { useState } from "react";
import {
  Filter,
  Search,
  ShieldCheck,
  ShieldOff,
  UserCog,
  Users,
} from "lucide-react";
import { adminService } from "../../services/marketplace";
import type { AdminUser } from "../../types";
import { useAsync, useDebounced } from "../../hooks/useAsync";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { formatDate } from "../../utils/format";
import { PageHeader } from "../../components/common/SectionHeader";
import { Avatar } from "../../components/ui/SmartImage";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState, RowsSkeleton, Spinner } from "../../components/ui/Feedback";

const ROLES = ["customer", "seller", "admin"];

export default function AdminUsersPage() {
  const toast = useToast();
  const { user: me } = useAuth();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [nextRole, setNextRole] = useState("customer");
  const [saving, setSaving] = useState(false);
  const debouncedQ = useDebounced(q, 300);

  const { data, loading, error, reload } = useAsync(
    () => adminService.users({ q: debouncedQ, role, page, limit: 12 }),
    [debouncedQ, role, page]
  );

  const users = data?.items ?? [];

  const open = (entry: AdminUser) => {
    setEditing(entry);
    setNextRole(entry.role);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await adminService.updateUser(editing._id, { role: nextRole });
      toast.success(`${editing.name} is now a ${nextRole}`);
      setEditing(null);
      reload();
    } catch (err) {
      toast.error("We could not update that account", err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (entry: AdminUser) => {
    try {
      await adminService.updateUser(entry._id, { isActive: !entry.isActive });
      toast.success(entry.isActive ? `${entry.name} suspended` : `${entry.name} reactivated`);
      reload();
    } catch (err) {
      toast.error("We could not update that account", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="People"
        title="Users"
        description="Every account on Campora. Promote sellers, keep admins minimal, and suspend abuse."
      />

      <div className="filters-toolbar">
        <label className="field field--search">
          <span className="sr-only">Search users</span>
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={q}
            placeholder="Name or email"
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="field field--inline">
          <Filter size={15} aria-hidden="true" />
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All roles</option>
            {ROLES.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="form-alert">{error}</p> : null}
      {loading && !data ? <RowsSkeleton count={6} /> : null}

      {data && users.length === 0 ? (
        <EmptyState
          icon={<Users size={26} aria-hidden="true" />}
          title="No users match"
          description="Try a different name, email or role."
        />
      ) : null}

      {users.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Campus</th>
                <th scope="col">Store</th>
                <th scope="col">Joined</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((entry) => (
                <tr key={entry._id} className={entry.isActive ? undefined : "is-muted"}>
                  <td>
                    <div className="table-person">
                      <Avatar src={entry.avatar} name={entry.name} size={34} />
                      <span>
                        <span className="table-strong">{entry.name}</span>
                        <span className="table-sub">{entry.email}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={
                        entry.role === "admin"
                          ? "badge badge--brand"
                          : entry.role === "seller"
                            ? "badge badge--success"
                            : "badge badge--neutral"
                      }
                    >
                      {entry.role}
                    </span>
                  </td>
                  <td>{entry.university?.name || entry.university?.code || "—"}</td>
                  <td>
                    {entry.store ? (
                      <span className="table-sub">{entry.store.name}</span>
                    ) : (
                      <span className="table-sub">—</span>
                    )}
                  </td>
                  <td>{formatDate(entry.createdAt)}</td>
                  <td>
                    <span className={entry.isActive ? "badge badge--success" : "badge badge--danger"}>
                      {entry.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => open(entry)}
                      aria-label={`Change role for ${entry.name}`}
                    >
                      <UserCog size={14} aria-hidden="true" />
                    </button>
                    {entry._id !== me?.id ? (
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => toggleActive(entry)}
                      >
                        {entry.isActive ? (
                          <>
                            <ShieldOff size={14} aria-hidden="true" />
                            Suspend
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={14} aria-hidden="true" />
                            Reactivate
                          </>
                        )}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {data ? <Pagination pagination={data.pagination} onChange={setPage} /> : null}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Role for ${editing.name}` : "Change role"}
        description="Sellers can open a store; admins see the operations console."
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="submit" form="role-form" className="btn btn--primary" disabled={saving}>
              {saving ? <Spinner size={15} /> : null}
              Update role
            </button>
          </>
        }
      >
        <form id="role-form" className="form-stack" onSubmit={save}>
          <label className="field">
            <span className="field__label">Role</span>
            <select value={nextRole} onChange={(event) => setNextRole(event.target.value)}>
              {ROLES.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>
          {editing ? (
            <p className="form-note">
              {editing.email} joined {formatDate(editing.createdAt, "long")}.
            </p>
          ) : null}
        </form>
      </Modal>
    </div>
  );
}
