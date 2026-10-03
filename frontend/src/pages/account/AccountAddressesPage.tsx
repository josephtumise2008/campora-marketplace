import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { userService } from "../../services/marketplace";
import type { Address } from "../../types";
import { useAsync } from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import { PageHeader } from "../../components/common/SectionHeader";
import { Modal } from "../../components/ui/Modal";
import { EmptyState, RowsSkeleton, Spinner } from "../../components/ui/Feedback";

const EMPTY: Omit<Address, "_id"> = {
  label: "Dorm",
  recipient: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
  instructions: "",
  type: "dorm",
  isDefault: false,
};

const TYPES = [
  { value: "dorm", label: "Dorm or residence hall" },
  { value: "apartment", label: "Apartment" },
  { value: "home", label: "Home (off campus)" },
  { value: "other", label: "Other" },
];

export default function AccountAddressesPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => userService.addresses(), []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<Omit<Address, "_id">>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (entry: Address) => {
    setEditing(entry);
    setForm({
      label: entry.label,
      recipient: entry.recipient,
      line1: entry.line1,
      line2: entry.line2 || "",
      city: entry.city,
      state: entry.state,
      zip: entry.zip,
      phone: entry.phone || "",
      instructions: entry.instructions || "",
      type: entry.type || "dorm",
      isDefault: entry.isDefault,
    });
    setFormError(null);
    setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!form.recipient.trim() || !form.line1.trim() || !form.city.trim() || !form.zip.trim()) {
      setFormError("Recipient, street, city and ZIP are required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await userService.updateAddress(editing._id, form);
        toast.success("Address updated");
      } else {
        await userService.createAddress(form);
        toast.success("Address saved");
      }
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "We could not save that address");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (entry: Address) => {
    try {
      await userService.deleteAddress(entry._id);
      toast.success("Address removed");
      reload();
    } catch (err) {
      toast.error("We could not remove that address", err instanceof Error ? err.message : undefined);
    }
  };

  const makeDefault = async (entry: Address) => {
    try {
      await userService.updateAddress(entry._id, { isDefault: true });
      toast.success("Default delivery address updated");
      reload();
    } catch (err) {
      toast.error("We could not update that", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader
        title="Delivery addresses"
        description="Addresses you can deliver to. Your default is pre-selected at checkout."
        actions={
          <button type="button" className="btn btn--primary" onClick={openNew}>
            <Plus size={16} aria-hidden="true" />
            Add address
          </button>
        }
      />

      {error ? (
        <p className="form-alert" role="alert">
          {error}
        </p>
      ) : null}
      {loading && !data ? <RowsSkeleton count={2} /> : null}

      {data && data.length === 0 ? (
        <EmptyState
          icon={<MapPin size={26} aria-hidden="true" />}
          title="No addresses yet"
          description="Add your dorm or apartment so checkout is one tap faster."
          action={
            <button type="button" className="btn btn--primary" onClick={openNew}>
              Add your first address
            </button>
          }
        />
      ) : null}

      <ul className="address-cards">
        {(data || []).map((entry) => (
          <li key={entry._id} className="address-card">
            <header>
              <span className="address-card__label">
                <MapPin size={14} aria-hidden="true" />
                {entry.label}
              </span>
              {entry.isDefault ? <span className="badge badge--success">Default</span> : null}
            </header>
            <p className="address-card__recipient">{entry.recipient}</p>
            <p className="address-card__lines">
              {entry.line1}
              {entry.line2 ? `, ${entry.line2}` : ""}
              <br />
              {entry.city}, {entry.state} {entry.zip}
            </p>
            {entry.phone ? <p className="address-card__phone">{entry.phone}</p> : null}
            {entry.instructions ? (
              <p className="address-card__note">“{entry.instructions}”</p>
            ) : null}
            <footer>
              <button
                type="button"
                className="link-plain"
                onClick={() => openEdit(entry)}
                aria-label={`Edit address for ${entry.recipient}`}
              >
                <Pencil size={13} aria-hidden="true" /> Edit
              </button>
              {!entry.isDefault ? (
                <button
                  type="button"
                  className="link-plain"
                  onClick={() => makeDefault(entry)}
                >
                  <Check size={13} aria-hidden="true" /> Make default
                </button>
              ) : null}
              <button
                type="button"
                className="link-plain link-plain--danger"
                onClick={() => remove(entry)}
                aria-label={`Remove address for ${entry.recipient}`}
              >
                <Trash2 size={13} aria-hidden="true" /> Remove
              </button>
            </footer>
          </li>
        ))}
      </ul>

      <p className="form-note">
        Need a hand? Read about delivery on campus in the <Link to="/help">help centre</Link>.
      </p>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit address" : "Add a delivery address"}
        description="Couriers use this to find you on campus."
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="address-form" className="btn btn--primary" disabled={saving}>
              {saving ? <Spinner size={15} /> : null}
              {editing ? "Save changes" : "Add address"}
            </button>
          </>
        }
      >
        <form id="address-form" className="form-stack" onSubmit={save}>
          {formError ? (
            <p className="form-alert" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="form-grid">
            <label className="field">
              <span className="field__label">Label</span>
              <input
                value={form.label}
                onChange={(event) => setForm({ ...form, label: event.target.value })}
                placeholder="Dorm, Apartment, Home…"
              />
            </label>
            <label className="field">
              <span className="field__label">Type</span>
              <select
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
              >
                {TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field field--wide">
              <span className="field__label">Recipient name</span>
              <input
                required
                value={form.recipient}
                onChange={(event) => setForm({ ...form, recipient: event.target.value })}
              />
            </label>
            <label className="field field--wide">
              <span className="field__label">Street address</span>
              <input
                required
                value={form.line1}
                onChange={(event) => setForm({ ...form, line1: event.target.value })}
                placeholder="100 Campus Way, Apt 4B"
              />
            </label>
            <label className="field field--wide">
              <span className="field__label">Apartment, suite (optional)</span>
              <input
                value={form.line2}
                onChange={(event) => setForm({ ...form, line2: event.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">City</span>
              <input
                required
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">State</span>
              <input
                value={form.state}
                onChange={(event) => setForm({ ...form, state: event.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">ZIP</span>
              <input
                required
                value={form.zip}
                onChange={(event) => setForm({ ...form, zip: event.target.value })}
                inputMode="numeric"
              />
            </label>
            <label className="field">
              <span className="field__label">Phone</span>
              <input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                inputMode="tel"
              />
            </label>
            <label className="field field--wide">
              <span className="field__label">Delivery notes</span>
              <input
                value={form.instructions}
                onChange={(event) => setForm({ ...form, instructions: event.target.value })}
                placeholder="Buzzer 3C — text on arrival"
              />
            </label>
          </div>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) => setForm({ ...form, isDefault: event.target.checked })}
            />
            <span>Use this as my default delivery address</span>
          </label>
        </form>
      </Modal>
    </div>
  );
}
