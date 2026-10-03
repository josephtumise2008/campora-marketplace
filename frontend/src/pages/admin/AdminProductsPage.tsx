import { useState } from "react";
import { Link } from "react-router-dom";
import { Boxes, Filter, Search, Store as StoreIcon } from "lucide-react";
import { adminService } from "../../services/marketplace";
import { useAsync, useDebounced } from "../../hooks/useAsync";
import { currency, cx, formatDate, numberCompact } from "../../utils/format";
import { PageHeader } from "../../components/common/SectionHeader";
import { SmartImage } from "../../components/ui/SmartImage";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState, RowsSkeleton } from "../../components/ui/Feedback";

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "out_of_stock", label: "Out of stock" },
  { value: "archived", label: "Archived" },
];

const TONE: Record<string, string> = {
  active: "badge--success",
  draft: "badge--warning",
  out_of_stock: "badge--danger",
  archived: "badge--neutral",
};

export default function AdminProductsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const debouncedQ = useDebounced(q, 300);

  const { data, loading, error } = useAsync(
    () => adminService.products({ q: debouncedQ, status, page, limit: 14 }),
    [debouncedQ, status, page]
  );

  const products = data?.items ?? [];

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Every listing across all campus stores. Sellers manage their own items; this view is for oversight."
        actions={
          <Link to="/admin/stores" className="btn btn--ghost">
            <StoreIcon size={15} aria-hidden="true" />
            Browse by store
          </Link>
        }
      />

      <div className="filters-toolbar">
        <label className="field field--search">
          <span className="sr-only">Search products</span>
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={q}
            placeholder="Product name"
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="field field--inline">
          <Filter size={15} aria-hidden="true" />
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            {STATUSES.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="form-alert">{error}</p> : null}
      {loading && !data ? <RowsSkeleton count={7} /> : null}

      {data && products.length === 0 ? (
        <EmptyState
          icon={<Boxes size={26} aria-hidden="true" />}
          title="No products match"
          description="Try a different name or status."
        />
      ) : null}

      {products.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Store</th>
                <th scope="col">Category</th>
                <th scope="col">Price</th>
                <th scope="col">Stock</th>
                <th scope="col">Sold</th>
                <th scope="col">Status</th>
                <th scope="col">Listed</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className="table-person">
                      <SmartImage
                        src={product.images?.[0]}
                        alt={product.name}
                        ratio="square"
                        fallbackLabel={product.name}
                      />
                      <span>
                        <Link to={`/products/${product._id}`} className="table-strong">
                          {product.name}
                        </Link>
                        <span className="table-sub">{product.sku || "No SKU"}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    {product.store?.slug ? (
                      <Link to={`/stores/${product.store.slug}`}>{product.store.name}</Link>
                    ) : (
                      <span className="table-sub">—</span>
                    )}
                  </td>
                  <td>{product.category?.name || "—"}</td>
                  <td>
                    <span className="table-strong">{currency(product.price)}</span>
                    {product.compareAtPrice > product.price ? (
                      <span className="table-sub">
                        <s>{currency(product.compareAtPrice)}</s>
                      </span>
                    ) : null}
                  </td>
                  <td>
                    <span className={cx(product.stock <= 5 ? "badge badge--warning" : "table-strong")}>
                      {product.stock}
                    </span>
                  </td>
                  <td>{numberCompact(product.soldCount || 0)}</td>
                  <td>
                    <span className={cx("badge", TONE[product.status] || "badge--neutral")}>
                      {product.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td>{formatDate(product.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {data ? <Pagination pagination={data.pagination} onChange={setPage} /> : null}
    </div>
  );
}
