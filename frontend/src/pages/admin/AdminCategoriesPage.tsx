import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  GripVertical,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Tags,
  Trash2,
} from "lucide-react";
import { adminService, marketplaceService } from "../../services/marketplace";
import type { Category } from "../../types";
import { useAsync } from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import { CATEGORY_ACCENTS, CATEGORY_ICONS } from "../../data/categoryIcons";
import { CategoryIcon } from "../../components/common/CategoryIcon";
import { cx, numberCompact } from "../../utils/format";
import { PageHeader } from "../../components/common/SectionHeader";
import { SmartImage } from "../../components/ui/SmartImage";
import { Modal } from "../../components/ui/Modal";
import { EmptyState, RowsSkeleton, Spinner } from "../../components/ui/Feedback";

const BLANK: Partial<Category> = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  image: "",
  icon: "Package",
  accent: "#1A73E8",
  order: 0,
  featured: false,
  status: "active",
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export default function AdminCategoriesPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => marketplaceService.categories(), []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [draft, setDraft] = useState<Partial<Category>>(BLANK);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [recounting, setRecounting] = useState(false);

  const categories = data ?? [];

  const openNew = () => {
    setEditing(null);
    setDraft({ ...BLANK, order: categories.length + 1 });
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setDraft({ ...category });
    setFormError(null);
    setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.name?.trim()) {
      setFormError("Give the category a name");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: draft.name.trim(),
        slug: (draft.slug || slugify(draft.name || "")).trim(),
        tagline: draft.tagline?.trim() || "",
        description: draft.description?.trim() || "",
        image: draft.image || "",
        icon: draft.icon || "Package",
        accent: draft.accent || "#1A73E8",
        order: Number(draft.order) || 0,
        featured: Boolean(draft.featured),
        status: draft.status || "active",
      };
      if (editing) {
        await adminService.updateCategory(editing._id, body);
        toast.success("Category updated");
      } else {
        await adminService.createCategory(body);
        toast.success("Category created");
      }
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "We could not save that category");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      await adminService.deleteCategory(confirm._id);
      toast.success("Category removed");
      setConfirm(null);
      reload();
    } catch (err) {
      toast.error(
        "That category still has products",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setDeleting(false);
    }
  };

  const recount = async () => {
    setRecounting(true);
    try {
      await adminService.recountCategories();
      toast.success("Product counts refreshed");
      reload();
    } catch (err) {
      toast.error("We could not refresh counts", err instanceof Error ? err.message : undefined);
    } finally {
      setRecounting(false);
    }
  };

  const move = async (category: Category, direction: -1 | 1) => {
    const next = Number(category.order) + direction;
    try {
      await adminService.updateCategory(category._id, { order: next });
      reload();
    } catch (err) {
      toast.error("We could not reorder", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Taxonomy"
        title="Categories"
        description="Categories drive explore filters, the home page and seller product forms. Order controls their display order."
        actions={
          <>
            <button type="button" className="btn btn--ghost" onClick={recount} disabled={recounting}>
              {recounting ? <Spinner size={15} /> : <RefreshCw size={15} aria-hidden="true" />}
              Refresh counts
            </button>
            <button type="button" className="btn btn--primary" onClick={openNew}>
              <Plus size={16} aria-hidden="true" />
              New category
            </button>
          </>
        }
      />

      {error ? <p className="form-alert">{error}</p> : null}
      {loading && !data ? <RowsSkeleton count={6} /> : null}

      {data && categories.length === 0 ? (
        <EmptyState
          icon={<Tags size={26} aria-hidden="true" />}
          title="No categories yet"
          description="Add the first category so sellers can list products."
          action={
            <button type="button" className="btn btn--primary" onClick={openNew}>
              Add a category
            </button>
          }
        />
      ) : null}

      {categories.length > 0 ? (
        <ul className="category-admin">
          {categories.map((category, index) => (
            <li key={category._id} className="category-admin__row">
              <span className="category-admin__handle" aria-hidden="true">
                <GripVertical size={15} />
              </span>
              <span className="category-admin__order">{index + 1}</span>
              <SmartImage
                src={category.image}
                alt={category.name}
                ratio="square"
                fallbackLabel={category.name}
              />
              <div className="category-admin__body">
                <p className="category-admin__name">
                  <Link to={`/category/${category.slug}`}>{category.name}</Link>
                  <span className="category-admin__slug">/{category.slug}</span>
                </p>
                <p className="category-admin__tagline">{category.tagline || "No tagline"}</p>
                <p className="category-admin__flags">
                  <span
                    className="badge"
                    style={{ background: category.accent || "#1A73E8" }}
                    aria-hidden="true"
                  >
                    {category.name}
                  </span>
                  <span className="badge badge--neutral">
                    {numberCompact(category.productCount || 0)} products
                  </span>
                  {category.featured ? (
                    <span className="badge badge--brand">
                      <Star size={11} aria-hidden="true" /> Featured
                    </span>
                  ) : null}
                  {category.status !== "active" ? (
                    <span className="badge badge--warning">{category.status}</span>
                  ) : null}
                </p>
              </div>
              <div className="category-admin__actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => move(category, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${category.name} up`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => move(category, 1)}
                  disabled={index === categories.length - 1}
                  aria-label={`Move ${category.name} down`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => openEdit(category)}
                >
                  <Pencil size={14} aria-hidden="true" />
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setConfirm(category)}
                  aria-label={`Delete ${category.name}`}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="form-note">
        <AlertTriangle size={13} aria-hidden="true" /> A category can only be deleted once every product
        has been moved or archived.
      </p>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit ${editing.name}` : "New category"}
        description="Slugs are used in URLs, so keep them short and stable."
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="category-form" className="btn btn--primary" disabled={saving}>
              {saving ? <Spinner size={15} /> : null}
              {editing ? "Save changes" : "Create category"}
            </button>
          </>
        }
      >
        <form id="category-form" className="form-stack" onSubmit={save}>
          {formError ? (
            <p className="form-alert" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="form-grid">
            <label className="field">
              <span className="field__label">Name</span>
              <input
                required
                value={draft.name || ""}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    name: event.target.value,
                    slug: editing ? draft.slug : slugify(event.target.value),
                  })
                }
              />
            </label>
            <label className="field">
              <span className="field__label">Slug</span>
              <input
                value={draft.slug || ""}
                onChange={(event) => setDraft({ ...draft, slug: slugify(event.target.value) })}
              />
            </label>
            <label className="field field--wide">
              <span className="field__label">Tagline</span>
              <input
                value={draft.tagline || ""}
                onChange={(event) => setDraft({ ...draft, tagline: event.target.value })}
                placeholder="Coffee, snacks and dorm essentials"
              />
            </label>
            <label className="field field--wide">
              <span className="field__label">Description</span>
              <textarea
                rows={3}
                value={draft.description || ""}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">Image path</span>
              <input
                value={draft.image || ""}
                onChange={(event) => setDraft({ ...draft, image: event.target.value })}
                placeholder="categories/groceries.jpg"
              />
            </label>
            <label className="field">
              <span className="field__label">Display order</span>
              <input
                value={String(draft.order ?? 0)}
                onChange={(event) => setDraft({ ...draft, order: Number(event.target.value) })}
                inputMode="numeric"
              />
            </label>
          </div>

          <div className="field">
            <span className="field__label">Icon</span>
            <div className="chip-row">
              {Object.keys(CATEGORY_ICONS).map((icon) => {
                return (
                  <button
                    key={icon}
                    type="button"
                    className={cx("chip chip--icon", draft.icon === icon && "is-active")}
                    onClick={() => setDraft({ ...draft, icon })}
                    aria-label={icon}
                    aria-pressed={draft.icon === icon}
                  >
                    <CategoryIcon name={icon} size={15} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="field">
            <span className="field__label">Accent colour</span>
            <div className="chip-row">
              {Object.entries(CATEGORY_ACCENTS).map(([name, value]) => (
                <button
                  key={value}
                  type="button"
                  className={cx("chip chip--swatch", draft.accent === value && "is-active")}
                  style={{ background: value }}
                  onClick={() => setDraft({ ...draft, accent: value })}
                  aria-label={`Accent ${name}`}
                  aria-pressed={draft.accent === value}
                >
                  {draft.accent === value ? "✓" : ""}
                </button>
              ))}
            </div>
          </div>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={Boolean(draft.featured)}
              onChange={(event) => setDraft({ ...draft, featured: event.target.checked })}
            />
            <span>Feature on the home page</span>
          </label>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Delete this category?"
        size="sm"
        description={confirm ? `${confirm.name} will be removed from Campora.` : undefined}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setConfirm(null)}>
              Keep it
            </button>
            <button type="button" className="btn btn--danger" onClick={remove} disabled={deleting}>
              {deleting ? <Spinner size={15} /> : <Trash2 size={15} aria-hidden="true" />}
              Delete
            </button>
          </>
        }
      >
        <p className="modal__text">
          Categories with products cannot be deleted — archive the products first.
        </p>
      </Modal>
    </div>
  );
}
