import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cx } from "../../utils/format";

export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return <Loader2 className={cx("spinner", className)} size={size} aria-hidden="true" />;
}

export function LoadingBlock({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div className={cx("loading-block", className)} role="status" aria-live="polite">
      <Spinner size={26} />
      <p className="loading-block__label">{label}</p>
    </div>
  );
}

export function PageLoader({ label = "Loading Campora" }: { label?: string }) {
  return (
    <div className="page-loader">
      <Spinner size={30} />
      <p>{label}</p>
    </div>
  );
}

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={cx("skeleton", className)} style={style} aria-hidden="true" />;
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card product-card--skeleton" aria-hidden="true">
      <Skeleton className="skeleton--media" />
      <div className="product-card__body">
        <Skeleton className="skeleton--line skeleton--tiny" />
        <Skeleton className="skeleton--line" />
        <Skeleton className="skeleton--line skeleton--short" />
        <Skeleton className="skeleton--pill" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }, (_value, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="store-grid">
      {Array.from({ length: count }, (_value, index) => (
        <div className="store-card store-card--skeleton" key={index} aria-hidden="true">
          <Skeleton className="skeleton--media" />
          <div className="store-card__body">
            <Skeleton className="skeleton--line" />
            <Skeleton className="skeleton--line skeleton--short" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RowsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="stack" aria-hidden="true">
      {Array.from({ length: count }, (_value, index) => (
        <Skeleton key={index} className="skeleton--row" />
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon ? <div className="empty-state__icon">{icon}</div> : null}
      <h3 className="empty-state__title">{title}</h3>
      {description ? <p className="empty-state__description">{description}</p> : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "We could not load this",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="empty-state empty-state--error" role="alert">
      <div className="empty-state__icon" style={{ color: "var(--danger-500)" }}>
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M12 8v5M12 17h.01" strokeLinecap="round" />
          <path d="M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      </div>
      <h3 className="empty-state__title">{title}</h3>
      {message ? <p className="empty-state__description">{message}</p> : null}
      {onRetry ? (
        <div className="empty-state__action">
          <button type="button" className="btn btn--secondary" onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}
