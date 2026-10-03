import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Check,
  ImagePlus,
  Info,
  Save,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { marketplaceService, sellerService } from "../../services/marketplace";
import type { Category, ProductSpec } from "../../types";
import { useToast } from "../../context/ToastContext";
import { PRODUCT_IMAGE_LIBRARY } from "../../data/images";
import { ImageUploader } from "../../components/ui/ImageUploader";
import { currency, cx, discountPercent } from "../../utils/format";
import { PageHeader } from "../../components/common/SectionHeader";
import { LoadingBlock, Spinner } from "../../components/ui/Feedback";

interface FormState {
  name: string;
  description: string;
  details: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  sku: string;
  unit: string;
  category: string;
  status: string;
  tags: string;
  images: string[];
  specs: ProductSpec[];
  dealBadge: string;
  featured: boolean;
}

const emptyForm: FormState = {
  name: "",
  description: "",
  details: "",
  price: "",
  compareAtPrice: "",
  stock: "10",
  sku: "",
  unit: "each",
  category: "",
  status: "active",
  tags: "",
  images: [],
  specs: [],
  dealBadge: "",
  featured: false,
};

const UNITS = ["each", "pack", "box", "kg", "lb", "oz", "bottle", "set", "hour", "service"];

export default function SellerProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [libraryOpen, setLibraryOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await marketplaceService.categories();
        if (!active) return;
        setCategories(list);
        setForm((current) => ({ ...current, category: current.category || list[0]?._id || "" }));
      } catch {
        /* the select simply stays empty */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const { product } = await marketplaceService.product(id);
        if (!active) return;
        setForm({
          name: product.name,
          description: product.description || "",
          details: product.details || "",
          price: String(product.price),
          compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
          stock: String(product.stock ?? 0),
          sku: product.sku || "",
          unit: product.unit || "each",
          category: product.category?._id || product.category?.slug || "",
          status: product.status || "active",
          tags: (product.tags || []).join(", "),
          images: product.images || [],
          specs: product.specs || [],
          dealBadge: product.deal?.badge || "",
          featured: Boolean(product.featured),
        });
      } catch (err) {
        toast.error("We could not load that product", err instanceof Error ? err.message : undefined);
        navigate("/seller/products", { replace: true });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, navigate, toast]);

  const price = Number(form.price) || 0;
  const compareAt = Number(form.compareAtPrice) || 0;
  const discount = useMemo(() => discountPercent(price, compareAt), [price, compareAt]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Give the product a name";
    else if (form.name.trim().length < 3) next.name = "Use at least 3 characters";
    if (!price || price <= 0) next.price = "Set a price above zero";
    if (compareAt && compareAt <= price) next.compareAtPrice = "Compare-at price must be higher";
    if (form.stock === "" || Number(form.stock) < 0) next.stock = "Stock cannot be negative";
    if (!form.category) next.category = "Pick a category";
    if (form.description.trim().length < 20) {
      next.description = "Describe the product in at least 20 characters";
    }
    if (form.images.length === 0) next.images = "Add at least one photo";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      toast.error("Check the highlighted fields");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      details: form.details.trim() || form.description.trim(),
      price,
      compareAtPrice: compareAt,
      stock: Number(form.stock),
      sku: form.sku.trim(),
      unit: form.unit,
      category: form.category,
      status: form.status,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      images: form.images,
      specs: form.specs.filter((spec) => spec.label.trim() && spec.value.trim()),
      featured: form.featured,
      deal: { isDeal: compareAt > price, badge: compareAt > price ? form.dealBadge.trim() || "Deal" : "" },
    };

    try {
      if (isEdit && id) {
        await sellerService.updateProduct(id, payload);
        toast.success("Product updated", "Changes are live in the marketplace.");
      } else {
        await sellerService.createProduct(payload);
        toast.success("Product listed", "Students on campus can find it now.");
      }
      navigate("/seller/products");
    } catch (err) {
      toast.error("We could not save that product", err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const toggleImage = (src: string) => {
    set("images", form.images.includes(src) ? form.images.filter((entry) => entry !== src) : [...form.images, src]);
    setErrors((current) => ({ ...current, images: "" }));
  };

  if (loading) return <LoadingBlock label="Loading product" />;

  return (
    <form className="stack-lg" onSubmit={submit} noValidate>
      <PageHeader
        eyebrow={isEdit ? "Edit listing" : "New listing"}
        title={isEdit ? form.name || "Edit product" : "Add a product"}
        description="Clear names, honest photos and an accurate stock count are what sell on campus."
        breadcrumbs={[{ label: "Seller", to: "/seller" }, { label: "Products", to: "/seller/products" }, { label: isEdit ? "Edit" : "New" }]}
        actions={
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? <Spinner size={15} /> : <Save size={15} aria-hidden="true" />}
            {isEdit ? "Save changes" : "Publish product"}
          </button>
        }
      />

      <section className="panel">
        <header className="panel__head">
          <h2>Basics</h2>
        </header>
        <div className="form-grid">
          <label className="field field--wide">
            <span className="field__label">Product name</span>
            <input
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
              placeholder="Organic oat milk, 1 L"
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name ? <span className="field__error">{errors.name}</span> : null}
          </label>

          <label className="field field--wide">
            <span className="field__label">Short description</span>
            <textarea
              rows={3}
              maxLength={400}
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
              placeholder="What it is, who it is for, and why campus students love it."
              aria-invalid={Boolean(errors.description)}
            />
            <span className="field__hint">
              {errors.description ? (
                <span className="field__error">{errors.description}</span>
              ) : (
                `${form.description.trim().length}/400 characters`
              )}
            </span>
          </label>

          <label className="field field--wide">
            <span className="field__label">Full details (optional)</span>
            <textarea
              rows={4}
              value={form.details}
              onChange={(event) => set("details", event.target.value)}
              placeholder="Ingredients, materials, sizing, care instructions…"
            />
          </label>

          <label className="field">
            <span className="field__label">Category</span>
            <select
              value={form.category}
              onChange={(event) => set("category", event.target.value)}
              aria-invalid={Boolean(errors.category)}
            >
              <option value="">Choose a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category ? <span className="field__error">{errors.category}</span> : null}
          </label>

          <label className="field">
            <span className="field__label">Sold as</span>
            <select value={form.unit} onChange={(event) => set("unit", event.target.value)}>
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </label>

          <label className="field field--wide">
            <span className="field__label">
              <Tag size={12} aria-hidden="true" /> Search tags
            </span>
            <input
              value={form.tags}
              onChange={(event) => set("tags", event.target.value)}
              placeholder="vegan, breakfast, oat, bestseller"
            />
            <span className="field__hint">Comma separated. Tags help campus search find you.</span>
          </label>
        </div>
      </section>

      <section className="panel">
        <header className="panel__head">
          <h2>Price & stock</h2>
        </header>
        <div className="form-grid">
          <label className="field">
            <span className="field__label">Price (USD)</span>
            <input
              value={form.price}
              onChange={(event) => set("price", event.target.value)}
              inputMode="decimal"
              placeholder="4.99"
              aria-invalid={Boolean(errors.price)}
            />
            {errors.price ? <span className="field__error">{errors.price}</span> : null}
          </label>

          <label className="field">
            <span className="field__label">Compare-at price</span>
            <input
              value={form.compareAtPrice}
              onChange={(event) => set("compareAtPrice", event.target.value)}
              inputMode="decimal"
              placeholder="6.49"
              aria-invalid={Boolean(errors.compareAtPrice)}
            />
            {errors.compareAtPrice ? (
              <span className="field__error">{errors.compareAtPrice}</span>
            ) : discount > 0 ? (
              <span className="field__hint">Shoppers see a -{discount}% badge.</span>
            ) : (
              <span className="field__hint">Set above the price to show a discount.</span>
            )}
          </label>

          <label className="field">
            <span className="field__label">Stock on hand</span>
            <input
              value={form.stock}
              onChange={(event) => set("stock", event.target.value)}
              inputMode="numeric"
              aria-invalid={Boolean(errors.stock)}
            />
            {errors.stock ? <span className="field__error">{errors.stock}</span> : null}
          </label>

          <label className="field">
            <span className="field__label">SKU</span>
            <input
              value={form.sku}
              onChange={(event) => set("sku", event.target.value)}
              placeholder="OAT-1L"
            />
          </label>

          {discount > 0 ? (
            <label className="field field--wide">
              <span className="field__label">Deal badge text</span>
              <input
                value={form.dealBadge}
                onChange={(event) => set("dealBadge", event.target.value)}
                placeholder="Campus favourite"
              />
              <span className="field__hint">
                Shown on the product card as “{form.dealBadge.trim() || "Deal"}”.
              </span>
            </label>
          ) : null}

          <label className="field field--wide">
            <span className="field__label">Visibility</span>
            <select value={form.status} onChange={(event) => set("status", event.target.value)}>
              <option value="active">Active — listed in search</option>
              <option value="draft">Draft — hidden from shoppers</option>
              <option value="out_of_stock">Out of stock</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label className="checkbox field--wide">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) => set("featured", event.target.checked)}
            />
            <span>Feature this product in your store highlights</span>
          </label>
        </div>

        {price > 0 ? (
          <p className="form-note">
            <Info size={13} aria-hidden="true" /> Students pay {currency(price)}
            {compareAt > price ? ` instead of ${currency(compareAt)}` : ""}. Campora's service fee and
            delivery are calculated at checkout.
          </p>
        ) : null}
      </section>

      <section className="panel">
        <header className="panel__head">
          <h2>Photos</h2>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setLibraryOpen((value) => !value)}
          >
            <ImagePlus size={14} aria-hidden="true" />
            {libraryOpen ? "Hide bundled art" : "Use bundled art"}
          </button>
        </header>

        {errors.images ? <p className="field__error">{errors.images}</p> : null}

        <ImageUploader
          value={form.images}
          onChange={(next) => {
            set("images", next);
            setErrors((current) => ({ ...current, images: "" }));
          }}
          max={6}
          label="Upload from your device"
          hint="Snap a photo with your phone or pick one from your computer."
          onError={(message) => setErrors((current) => ({ ...current, images: message }))}
        />

        {libraryOpen ? (
          <div className="image-library">
            {PRODUCT_IMAGE_LIBRARY.map((group) => (
              <section key={group.category}>
                <p className="image-library__title">{group.category}</p>
                <div className="image-library__grid">
                  {group.images.map((image) => (
                    <button
                      key={image}
                      type="button"
                      className={cx(
                        "image-library__item",
                        form.images.includes(image) && "is-selected"
                      )}
                      onClick={() => toggleImage(image)}
                      aria-pressed={form.images.includes(image)}
                    >
                      <img src={image} alt="" loading="lazy" />
                      {form.images.includes(image) ? (
                        <span className="image-library__check">
                          <Check size={13} aria-hidden="true" />
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </section>
            ))}
            <p className="form-note">
              <Sparkles size={13} aria-hidden="true" /> Photos come from the bundled Campora library so
              every listing works offline. First photo is the cover.
            </p>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <header className="panel__head">
          <h2>Specs</h2>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => set("specs", [...form.specs, { label: "", value: "" }])}
          >
            Add spec
          </button>
        </header>

        {form.specs.length === 0 ? (
          <p className="panel__text">
            Specs show as a small table on the product page — useful for electronics and gear.
          </p>
        ) : (
          <ul className="spec-rows">
            {form.specs.map((spec, index) => (
              <li key={index}>
                <input
                  value={spec.label}
                  placeholder="Label (e.g. Battery)"
                  onChange={(event) => {
                    const next = [...form.specs];
                    next[index] = { ...next[index], label: event.target.value };
                    set("specs", next);
                  }}
                />
                <input
                  value={spec.value}
                  placeholder="Value (e.g. 5000 mAh)"
                  onChange={(event) => {
                    const next = [...form.specs];
                    next[index] = { ...next[index], value: event.target.value };
                    set("specs", next);
                  }}
                />
                <button
                  type="button"
                  className="link-plain link-plain--danger"
                  onClick={() => set("specs", form.specs.filter((_, i) => i !== index))}
                  aria-label={`Remove spec ${index + 1}`}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="form-actions-bar">
        <Link to="/seller/products" className="btn btn--ghost">
          Cancel
        </Link>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? <Spinner size={15} /> : <Save size={15} aria-hidden="true" />}
          {isEdit ? "Save changes" : "Publish product"}
        </button>
      </div>
    </form>
  );
}
