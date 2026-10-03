import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, PackageSearch, Star, Store as StoreIcon, Truck, Users } from "lucide-react";
import { marketplaceService } from "../services/marketplace";
import type { Paginated, Store } from "../types";
import { useAsync } from "../hooks/useAsync";
import { useUniversity } from "../context/UniversityContext";
import { cx } from "../utils/format";
import { StoreCard } from "../components/common/StoreCard";
import { PageHeader } from "../components/common/SectionHeader";
import { EmptyState, CardGridSkeleton } from "../components/ui/Feedback";

const SORTS = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Highest rated" },
  { value: "reviews", label: "Most reviewed" },
  { value: "newest", label: "Newest" },
  { value: "name-asc", label: "A–Z" },
];

export default function StoresPage() {
  const { university } = useUniversity();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("recommended");
  const [campusOnly, setCampusOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [page, setPage] = useState(1);

  const query = {
    q,
    sort,
    university: campusOnly ? university?.code || "" : "",
    verified: verifiedOnly ? "true" : "",
    page,
    limit: 24,
  };

  const { data, loading } = useAsync<Paginated<Store>>(
    () => marketplaceService.stores(query),
    [q, sort, campusOnly, verifiedOnly, page, university?.code]
  );

  return (
    <div className="container page">
      <PageHeader
        title="Campus stores"
        description="Every store is run by a student or a local campus business, reviewed by the Campora team before it goes live."
        actions={
          <Link to="/sell" className="btn btn--accent">
            <StoreIcon size={16} aria-hidden="true" />
            Open your store
          </Link>
        }
      />

      <div className="stores-toolbar">
        <label className="field field--search">
          <span className="sr-only">Search stores</span>
          <input
            type="search"
            value={q}
            placeholder="Search stores by name or speciality"
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
          />
        </label>

        <label className="switch">
          <input
            type="checkbox"
            checked={campusOnly}
            onChange={(event) => {
              setCampusOnly(event.target.checked);
              setPage(1);
            }}
          />
          <span>
            <MapPin size={13} aria-hidden="true" /> Delivers to {university?.shortName || "my campus"}
          </span>
        </label>

        <label className="switch">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(event) => {
              setVerifiedOnly(event.target.checked);
              setPage(1);
            }}
          />
          <span>
            <Star size={13} aria-hidden="true" /> Verified only
          </span>
        </label>

        <label className="select-field select-field--sm">
          <span className="sr-only">Sort stores</span>
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="explore__count">
        {loading ? "Loading stores…" : `${data?.pagination.total ?? 0} stores`}
      </p>

      {loading && !data ? <CardGridSkeleton count={6} /> : null}

      {data && data.items.length === 0 ? (
        <EmptyState
          icon={<PackageSearch size={26} aria-hidden="true" />}
          title="No stores match those filters"
          description="Try clearing the campus filter, or search for a different speciality."
          action={
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setQ("");
                setCampusOnly(false);
                setVerifiedOnly(false);
                setPage(1);
              }}
            >
              Reset filters
            </button>
          }
        />
      ) : null}

      {data && data.items.length > 0 ? (
        <div className="store-grid store-grid--wide">
          {data.items.map((store, index) => (
            <StoreCard key={store._id} store={store} index={index} />
          ))}
        </div>
      ) : null}

      {data && data.pagination.totalPages > 1 ? (
        <div className={cx("pager")}>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={page <= 1}
          >
            Previous
          </button>
          <span>
            Page {page} of {data.pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setPage((value) => value + 1)}
            disabled={page >= data.pagination.totalPages}
          >
            Next
          </button>
        </div>
      ) : null}

      <section className="stores-cta">
        <div>
          <h2>Run one of these stores?</h2>
          <p>
            Sellers keep 92% of every order, set their own hours and choose which campus they serve.
          </p>
        </div>
        <ul className="stores-cta__perks">
          <li>
            <Truck size={15} aria-hidden="true" /> You choose delivery or pickup
          </li>
          <li>
            <Users size={15} aria-hidden="true" /> We surface you to nearby students
          </li>
        </ul>
        <Link to="/sell" className="btn btn--accent">
          Start selling
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </section>

      <p className="stores-note">
        Shopping on a different campus?{" "}
        <button
          type="button"
          className="link-plain"
          onClick={() => {
            setCampusOnly(!campusOnly);
            setPage(1);
          }}
        >
          {campusOnly ? "Show all campuses" : `Only show ${university?.shortName || "my campus"}`}
        </button>{" "}
        or change your campus from the header.
      </p>
    </div>
  );
}
