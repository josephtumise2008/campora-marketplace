import { useState } from "react";
import {
  BadgeCheck,
  Clock3,
  Info,
  Percent,
  Save,
  Store as StoreIcon,
  Tag,
  Truck,
} from "lucide-react";
import { sellerService } from "../../services/marketplace";
import type { Store, StoreHour } from "../../types";
import { useAsync } from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import { currency, cx, etaRange } from "../../utils/format";
import { PageHeader } from "../../components/common/SectionHeader";
import { SmartImage, StoreLogo } from "../../components/ui/SmartImage";
import { ImageUploader } from "../../components/ui/ImageUploader";
import { LoadingBlock, Spinner } from "../../components/ui/Feedback";

interface Draft {
  name: string;
  tagline: string;
  description: string;
  logo: string;
  cover: string;
  contactEmail: string;
  contactPhone: string;
  fee: string;
  freeThreshold: string;
  etaMinutes: string;
  minimumOrder: string;
  methods: string[];
  city: string;
  state: string;
  address: string;
  zip: string;
  hours: StoreHour[];
  returns: string;
  delivery: string;
  substitutions: string;
  promoHeadline: string;
  promoCode: string;
  promoDiscount: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const draftFrom = (store: Store): Draft => ({
  name: store.name,
  tagline: store.tagline || "",
  description: store.description || "",
  logo: store.logo || "",
  cover: store.cover || "",
  contactEmail: store.contact?.email || "",
  contactPhone: store.contact?.phone || "",
  fee: String(store.delivery?.fee ?? 2.99),
  freeThreshold: String(store.delivery?.freeThreshold ?? 35),
  etaMinutes: String(store.delivery?.etaMinutes ?? 40),
  minimumOrder: String(store.delivery?.minimumOrder ?? 0),
  methods: store.delivery?.methods?.length ? store.delivery.methods : ["Delivery", "Pickup"],
  city: store.location?.city || "",
  state: store.location?.state || "",
  address: store.location?.address || "",
  zip: store.location?.zip || "",
  hours: DAYS.map((day) => {
    const found = store.hours?.find((entry) => entry.day.toLowerCase() === day.toLowerCase());
    return found ? { ...found } : { day, open: "9:00 AM", close: "9:00 PM", closed: false };
  }),
  returns: store.policies?.returns || "Returns accepted within 7 days, unopened items only.",
  delivery: store.policies?.delivery || "Delivered by campus couriers between 9 AM and 9 PM.",
  substitutions: store.policies?.substitutions || "We may substitute a like-for-like item and refund the difference.",
  promoHeadline: store.promo?.headline || "",
  promoCode: store.promo?.code || "",
  promoDiscount: String(store.promo?.discountPercent ?? 10),
});

export default function SellerStoreSettingsPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => sellerService.myStore(), []);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Seed the editable draft once the store arrives. Adjusting during render keeps
  // the first paint in sync without a second flash of the loading state.
  if (data && !draft) setDraft(draftFrom(data));

  if (loading && !data) return <LoadingBlock label="Loading store settings" />;
  if (error) return <p className="form-alert">{error}</p>;
  if (!data || !draft) return null;

  const store = data;
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft({ ...draft, [key]: value });
    setDirty(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await sellerService.updateStore({
        name: draft.name.trim(),
        tagline: draft.tagline.trim(),
        description: draft.description.trim(),
        logo: draft.logo,
        cover: draft.cover,
        contact: { email: draft.contactEmail.trim(), phone: draft.contactPhone.trim() },
        delivery: {
          fee: Number(draft.fee) || 0,
          freeThreshold: Number(draft.freeThreshold) || 0,
          etaMinutes: Number(draft.etaMinutes) || 40,
          minimumOrder: Number(draft.minimumOrder) || 0,
          methods: draft.methods,
        },
        location: {
          city: draft.city.trim(),
          state: draft.state.trim(),
          address: draft.address.trim(),
          zip: draft.zip.trim(),
        },
        hours: draft.hours,
        policies: {
          returns: draft.returns.trim(),
          delivery: draft.delivery.trim(),
          substitutions: draft.substitutions.trim(),
        },
        promo: {
          headline: draft.promoHeadline.trim(),
          code: draft.promoCode.trim().toUpperCase(),
          discountPercent: Number(draft.promoDiscount) || 0,
        },
      });
      setDraft(draftFrom(updated.store));
      setDirty(false);
      toast.success("Store updated", "Your public page reflects these changes now.");
      reload();
    } catch (err) {
      toast.error("We could not save your store", err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const toggleMethod = (method: string) => {
    const next = draft.methods.includes(method)
      ? draft.methods.filter((entry) => entry !== method)
      : [...draft.methods, method];
    set("methods", next.length ? next : ["Pickup"]);
  };

  return (
    <form className="stack-lg" onSubmit={save}>
      <PageHeader
        eyebrow="Store profile"
        title="Store settings"
        description="This is what students see on your public store page. Contact details and policies are
          required for verification."
        breadcrumbs={[{ label: "Seller", to: "/seller" }, { label: "Store settings" }]}
        actions={
          <button type="submit" className="btn btn--primary" disabled={saving || !dirty}>
            {saving ? <Spinner size={15} /> : <Save size={15} aria-hidden="true" />}
            {dirty ? "Save changes" : "Saved"}
          </button>
        }
      />

      <section className={cx("panel", store.verification === "pending" && "panel--highlight")}>
        <header className="panel__head">
          <h2>
            <BadgeCheck size={17} aria-hidden="true" /> Verification
          </h2>
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
            {store.verification}
          </span>
        </header>
        {store.verification === "pending" ? (
          <p className="panel__text">
            A Campora admin reviews new stores. Keep your contact email, address and policies filled in —
            approval usually happens within one business day on campus.
          </p>
        ) : store.verification === "suspended" ? (
          <p className="panel__text">
            Your store is suspended. Contact support at campora@campora.market to restore it.
          </p>
        ) : (
          <p className="panel__text">
            You are verified. Your store appears with a verified badge and ranks higher in campus search.
          </p>
        )}
      </section>

      <section className="panel">
        <header className="panel__head">
          <h2>
            <StoreIcon size={17} aria-hidden="true" /> Identity
          </h2>
        </header>

        <div className="settings-brand">
          <StoreLogo logo={draft.logo || store.logo} name={draft.name} size="xl" />
          <div className="settings-brand__preview">
            <p className="field__label">Brand preview</p>
            <p className="settings-brand__name">{draft.name || "Your store name"}</p>
            <p className="settings-brand__tagline">{draft.tagline || "Your tagline appears here"}</p>
          </div>
        </div>

        <div className="form-grid">
          <label className="field">
            <span className="field__label">Store name</span>
            <input value={draft.name} onChange={(event) => set("name", event.target.value)} required />
          </label>
          <label className="field">
            <span className="field__label">Tagline</span>
            <input
              value={draft.tagline}
              onChange={(event) => set("tagline", event.target.value)}
              maxLength={140}
              placeholder="Fresh snacks delivered to your hall"
            />
          </label>
          <label className="field field--wide">
            <span className="field__label">About your store</span>
            <textarea
              rows={4}
              value={draft.description}
              onChange={(event) => set("description", event.target.value)}
              placeholder="Who you are, what you sell, and how fast you deliver."
            />
          </label>
          <label className="field">
            <span className="field__label">Contact email</span>
            <input
              type="email"
              value={draft.contactEmail}
              onChange={(event) => set("contactEmail", event.target.value)}
              placeholder="hello@yourstore.campus"
            />
          </label>
          <label className="field">
            <span className="field__label">Contact phone</span>
            <input
              value={draft.contactPhone}
              onChange={(event) => set("contactPhone", event.target.value)}
              inputMode="tel"
              placeholder="(555) 010-2030"
            />
          </label>
        </div>
      </section>

      <section className="panel">
        <header className="panel__head">
          <h2>
            <Truck size={17} aria-hidden="true" /> Delivery
          </h2>
        </header>
        <div className="form-grid">
          <label className="field">
            <span className="field__label">Delivery fee (USD)</span>
            <input
              value={draft.fee}
              onChange={(event) => set("fee", event.target.value)}
              inputMode="decimal"
            />
            <span className="field__hint">Set 0 for free campus delivery.</span>
          </label>
          <label className="field">
            <span className="field__label">Free delivery over</span>
            <input
              value={draft.freeThreshold}
              onChange={(event) => set("freeThreshold", event.target.value)}
              inputMode="decimal"
            />
          </label>
          <label className="field">
            <span className="field__label">Delivery time (minutes)</span>
            <input
              value={draft.etaMinutes}
              onChange={(event) => set("etaMinutes", event.target.value)}
              inputMode="numeric"
            />
            <span className="field__hint">
              Shoppers see “{etaRange(Number(draft.etaMinutes) || 40)}”.
            </span>
          </label>
          <label className="field">
            <span className="field__label">Minimum order (USD)</span>
            <input
              value={draft.minimumOrder}
              onChange={(event) => set("minimumOrder", event.target.value)}
              inputMode="decimal"
            />
          </label>

          <div className="field field--wide">
            <span className="field__label">Fulfilment methods</span>
            <div className="chip-row">
              {["Delivery", "Pickup"].map((method) => (
                <button
                  key={method}
                  type="button"
                  className={cx("chip", draft.methods.includes(method) && "is-active")}
                  onClick={() => toggleMethod(method)}
                  aria-pressed={draft.methods.includes(method)}
                >
                  {method}
                </button>
              ))}
            </div>
            <span className="field__hint">At least one method is required.</span>
          </div>
        </div>

        {Number(draft.fee) === 0 ? (
          <p className="form-note">
            <Info size={13} aria-hidden="true" /> Free delivery is a strong campus selling point —
            shoppers see a “Free delivery” badge on every one of your products.
          </p>
        ) : (
          <p className="form-note">
            <Info size={13} aria-hidden="true" /> Students pay {currency(Number(draft.fee) || 0)} per
            delivery, waived above {currency(Number(draft.freeThreshold) || 0)}.
          </p>
        )}
      </section>

      <section className="panel">
        <header className="panel__head">
          <h2>
            <Clock3 size={17} aria-hidden="true" /> Opening hours
          </h2>
        </header>
        <ul className="hours-rows">
          {draft.hours.map((entry, index) => (
            <li key={entry.day} className={cx(entry.closed && "is-closed")}>
              <span className="hours-rows__day">{entry.day.slice(0, 3)}</span>
              <label className="checkbox checkbox--tight">
                <input
                  type="checkbox"
                  checked={entry.closed}
                  onChange={(event) => {
                    const next = [...draft.hours];
                    next[index] = { ...entry, closed: event.target.checked };
                    set("hours", next);
                  }}
                />
                <span>Closed</span>
              </label>
              <input
                type="time"
                value={toTimeValue(entry.open)}
                disabled={entry.closed}
                onChange={(event) => {
                  const next = [...draft.hours];
                  next[index] = { ...entry, open: fromTimeValue(event.target.value) };
                  set("hours", next);
                }}
                aria-label={`${entry.day} opening time`}
              />
              <span aria-hidden="true">–</span>
              <input
                type="time"
                value={toTimeValue(entry.close)}
                disabled={entry.closed}
                onChange={(event) => {
                  const next = [...draft.hours];
                  next[index] = { ...entry, close: fromTimeValue(event.target.value) };
                  set("hours", next);
                }}
                aria-label={`${entry.day} closing time`}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <header className="panel__head">
          <h2>
            <Tag size={17} aria-hidden="true" /> Policies
          </h2>
        </header>
        <div className="form-grid">
          <label className="field field--wide">
            <span className="field__label">Returns</span>
            <textarea
              rows={2}
              value={draft.returns}
              onChange={(event) => set("returns", event.target.value)}
            />
          </label>
          <label className="field field--wide">
            <span className="field__label">Delivery</span>
            <textarea
              rows={2}
              value={draft.delivery}
              onChange={(event) => set("delivery", event.target.value)}
            />
          </label>
          <label className="field field--wide">
            <span className="field__label">Substitutions</span>
            <textarea
              rows={2}
              value={draft.substitutions}
              onChange={(event) => set("substitutions", event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="panel">
        <header className="panel__head">
          <h2>
            <Percent size={17} aria-hidden="true" /> Promotion
          </h2>
        </header>
        <div className="form-grid">
          <label className="field field--wide">
            <span className="field__label">Promo headline</span>
            <input
              value={draft.promoHeadline}
              onChange={(event) => set("promoHeadline", event.target.value)}
              placeholder="10% off your first order this week"
            />
          </label>
          <label className="field">
            <span className="field__label">Promo code</span>
            <input
              value={draft.promoCode}
              onChange={(event) => set("promoCode", event.target.value)}
              placeholder="CAMPUS10"
            />
          </label>
          <label className="field">
            <span className="field__label">Discount percent</span>
            <input
              value={draft.promoDiscount}
              onChange={(event) => set("promoDiscount", event.target.value)}
              inputMode="numeric"
            />
          </label>
        </div>
      </section>

      <div className="form-actions-bar">
        <p className="muted-note">{dirty ? "You have unsaved changes" : "Everything is saved"}</p>
        <button type="submit" className="btn btn--primary" disabled={saving || !dirty}>
          {saving ? <Spinner size={15} /> : <Save size={15} aria-hidden="true" />}
          Save store
        </button>
      </div>

      <section className="panel">
        <header className="panel__head">
          <h2>Brand assets</h2>
        </header>
        <p className="panel__text">
          Upload your own logo and cover from a phone or computer — we resize them for you.
        </p>

        <div className="asset-upload-grid">
          <ImageUploader
            value={draft.logo ? [draft.logo] : []}
            onChange={(next) => set("logo", next[0] || "")}
            max={1}
            single
            label="Store logo"
            coverLabel="Logo"
            hint="Square images look best."
          />
          <ImageUploader
            value={draft.cover ? [draft.cover] : []}
            onChange={(next) => set("cover", next[0] || "")}
            max={1}
            single
            label="Cover photo"
            coverLabel="Cover"
            hint="Wide banner, roughly 3:1."
          />
        </div>

        <div className="asset-preview">
          <div>
            <p className="field__label">Logo</p>
            <StoreLogo logo={draft.logo} name={draft.name} size="xl" />
            <p className="asset-preview__path">{draft.logo || store.logo}</p>
          </div>
          <div>
            <p className="field__label">Cover</p>
            <SmartImage
              src={draft.cover}
              alt="Store cover"
              ratio="wide"
              fallbackLabel={store.name}
            />
            <p className="asset-preview__path">{draft.cover || store.cover}</p>
          </div>
        </div>
      </section>
    </form>
  );
}

function toTimeValue(value: string) {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value.trim());
  if (!match) return "09:00";
  let hours = Number(match[1]) % 12;
  if (/pm/i.test(match[3])) hours += 12;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

function fromTimeValue(value: string) {
  const [hoursText, minutes] = value.split(":");
  const hours = Number(hoursText);
  const suffix = hours >= 12 ? "PM" : "AM";
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${display}:${minutes} ${suffix}`;
}
