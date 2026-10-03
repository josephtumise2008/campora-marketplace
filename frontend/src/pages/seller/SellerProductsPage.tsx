import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ChevronRight,
  Filter,
  Package,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { sellerService } from "../../services/marketplace";
import type { Product } from "../../types";
import { useAsync, useDebounced } from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import { currency, cx, numberCompact } from "../../utils/format";
import { PageHeader } from "../../components/common/SectionHeader";
import { SmartImage } from "../../components/ui/SmartImage";
import { Modal } from "../../components/ui/Modal";
import { EmptyState, ProductGridSkeleton, Spinner } from "../../components/ui/Feedback";

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "out_of_stock", label: "Out of stock" },
  { value: "archived", label: "Archived" },
];

const STATUS_TONE: Record<string, string> = {
  active: "badge--success",
  draft: "badge--warning",
  out_of_stock: "badge--danger",
  archived: "badge--neutral",
};

export default function SellerProductsPage() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [confirm, setConfirm] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const debouncedQ = useDebounced(q, 300);

  const { data, loading, error, reload } = useAsync(
    () => sellerService.myProducts({ q: debouncedQ, status }),
    [debouncedQ, status]
  );

  const products = data?.items ?? [];
  const store = data?.store;

  const remove = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      await sellerService.deleteProduct(confirm._id);
      toast.success("Product deleted", `${confirm.name} is no longer listed.`);
      setConfirm(null);
      reload();
    } catch (err) {
      toast.error("We could not delete that product", err instanceof Error ? err.message : undefined);
    } finally {
      setDeleting(false);
    }
  };

  const duplicate = async (product: Product) => {
    try {
      await sellerService.createProduct({
        name: `${product.name} (copy)`,
        description: product.description,
        details: product.details,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        images: product.images,
        category: product.category?._id || product.category,
        stock: product.stock,
        sku: `${product.sku || "SKU"}-COPY`,
        tags: product.tags,
        specs: product.specs,
        unit: product.unit,
        status: "draft",
        deal: { isDeal: false, badge: "" },
      });
      toast.success("Draft copy created", "Edit it and publish when you are ready.");
      reload();
    } catch (err) {
      toast.error("We could not duplicate that product", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow={store ? `${products.length} of ${data?.pagination.total ?? 0} listed` : "Catalogue"}
        title="Products"
        description="Add what you sell, keep stock accurate, and mark items on deal to win campus traffic."
        actions={
          <Link to="/seller/products/new" className="btn btn--primary">
            <Plus size={16} aria-hidden="true" />
            New product
          </Link>
        }
      />

      <div className="filters-toolbar">
        <label className="field field--search">
          <span className="sr-only">Search your products</span>
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={q}
            placeholder="Search by name"
            onChange={(event) => setQ(event.target.value)}
          />
        </label>
        <label className="field field--inline">
          <Filter size={15} aria-hidden="true" />
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {STATUSES.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="form-alert">{error}</p> : null}
      {loading && !data ? <ProductGridSkeleton count={6} /> : null}

      {data && products.length === 0 ? (
        <EmptyState
          icon={<Package size={26} aria-hidden="true" />}
          title={q || status ? "No products match those filters" : "Your catalogue is empty"}
          description={
            q || status
              ? "Clear the search or status filter to see everything."
              : "List your first product and it appears in campus search immediately."
          }
          action={
            <Link to="/seller/products/new" className="btn btn--primary">
              Add a product
            </Link>
          }
        />
      ) : null}

      {products.length > 0 ? (
        <ul className="seller-products">
          {products.map((product) => {
            const low = product.stock <= 5;
            return (
              <li key={product._id} className="seller-product">
                <Link to={`/products/${product._id}`} className="seller-product__media">
                  <SmartImage
                    src={product.images?.[0]}
                    alt={product.name}
                    ratio="square"
                    fallbackLabel={product.name}
                  />
                </Link>

                <div className="seller-product__body">
                  <p className="seller-product__category">{product.category?.name || "Uncategorised"}</p>
                  <h3>
                    <Link to={`/products/${product._id}`}>{product.name}</Link>
                  </h3>
                  <p className="seller-product__meta">
                    <span className="seller-product__price">
                      {currency(product.price)}
                      {product.compareAtPrice > product.price ? (
                        <s>{currency(product.compareAtPrice)}</s>
                      ) : null}
                    </span>
                    <span className="seller-product__sold">
                      <Star size={12} aria-hidden="true" /> {product.rating?.average?.toFixed(1) || "New"} ·{" "}
                      {numberCompact(product.soldCount || 0)} sold
                    </span>
                  </p>
                  <p className="seller-product__flags">
                    <span className={cx("badge", STATUS_TONE[product.status] || "badge--neutral")}>
                      {product.status.replace(/_/g, " ")}
                    </span>
                    {low ? (
                      <span className="badge badge--warning">
                        <AlertTriangle size={11} aria-hidden="true" /> {product.stock} left
                      </span>
                    ) : null}
                    {product.deal?.isDeal ? <span className="badge badge--danger">Deal</span> : null}
                    {product.featured ? <span className="badge badge--brand">Featured</span> : null}
                  </p>
                </div>

                <div className="seller-product__actions">
                  <Link
                    to={`/seller/products/${product._id}/edit`}
                    className="btn btn--secondary btn--sm"
                  >
                    <Pencil size={14} aria-hidden="true" />
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => duplicate(product)}
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm link-plain--danger"
                    onClick={() => setConfirm(product)}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {data && data.pagination.totalPages > 1 ? (
        <p className="muted-note">
          Showing {products.length} of {data.pagination.total} products
          <ChevronRight size={13} aria-hidden="true" />
        </p>
      ) : null}

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Delete this product?"
        description={confirm ? `${confirm.name} will be removed from the marketplace.` : undefined}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setConfirm(null)}>
              Keep it
            </button>
            <button type="button" className="btn btn--danger" onClick={remove} disabled={deleting}>
              {deleting ? <Spinner size={15} /> : <Trash2 size={15} aria-hidden="true" />}
              Delete product
            </button>
          </>
        }
      >
        <p className="modal__text">
          Students who saved this product will no longer see it. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
