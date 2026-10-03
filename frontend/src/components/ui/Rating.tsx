import type { ReactNode } from "react";
import { Star } from "lucide-react";
import { cx } from "../../utils/format";

interface RatingProps {
  value: number;
  count?: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}

export function Rating({ value, count, size = 14, showValue = true, className }: RatingProps) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className={cx("rating", className)} title={`${value.toFixed(1)} out of 5`}>
      <span className="rating__stars" aria-hidden="true">
        {Array.from({ length: 5 }, (_value, index) => {
          const filled = rounded - index;
          return (
            <span key={index} className="rating__star" style={{ width: size, height: size }}>
              <Star className="rating__star-bg" size={size} strokeWidth={1.6} />
              {filled > 0 ? (
                <span className="rating__star-fill" style={{ width: `${Math.min(1, filled) * 100}%` }}>
                  <Star size={size} strokeWidth={1.6} />
                </span>
              ) : null}
            </span>
          );
        })}
      </span>
      {showValue ? <span className="rating__value">{value.toFixed(1)}</span> : null}
      {typeof count === "number" ? (
        <span className="rating__count">({count})</span>
      ) : null}
      <span className="sr-only">
        Rated {value.toFixed(1)} out of 5{typeof count === "number" ? ` from ${count} reviews` : ""}
      </span>
    </span>
  );
}

interface RatingBarsProps {
  buckets: { _id: number; count: number }[];
  total: number;
  average: number;
}

export function RatingBars({ buckets, total, average }: RatingBarsProps) {
  const map = new Map(buckets.map((bucket) => [bucket._id, bucket.count]));
  return (
    <div className="rating-bars">
      {Array.from({ length: 5 }, (_value, index) => index + 1).reverse().map((star) => {
        const count = map.get(star) || 0;
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div className="rating-bars__row" key={star}>
            <span className="rating-bars__label">
              {star} <Star size={11} fill="currentColor" strokeWidth={0} aria-hidden="true" />
            </span>
            <span className="rating-bars__track">
              <span className="rating-bars__fill" style={{ width: `${percent}%` }} />
            </span>
            <span className="rating-bars__count">{count}</span>
          </div>
        );
      })}
      <p className="rating-bars__summary">
        <strong>{average.toFixed(1)}</strong> average across {total} review{total === 1 ? "" : "s"}
      </p>
    </div>
  );
}

interface StarPickerProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  label?: string;
}

export function StarPicker({ value, onChange, size = 26, label = "Rating" }: StarPickerProps) {
  return (
    <div className="star-picker" role="radiogroup" aria-label={label}>
      {Array.from({ length: 5 }, (_value, index) => index + 1).map((star) => {
        const active = star <= value;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            className={cx("star-picker__star", active && "is-active")}
            onClick={() => onChange(star)}
          >
            <Star size={size} fill={active ? "currentColor" : "none"} strokeWidth={1.6} />
          </button>
        );
      })}
      {value > 0 ? <span className="star-picker__value">{value}/5</span> : null}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "brand" | "success" | "warning" | "danger";
}) {
  return (
    <div className={cx("stat-tile", `stat-tile--${tone}`)}>
      <div className="stat-tile__top">
        <span className="stat-tile__label">{label}</span>
        {icon ? <span className="stat-tile__icon">{icon}</span> : null}
      </div>
      <p className="stat-tile__value">{value}</p>
      {hint ? <p className="stat-tile__hint">{hint}</p> : null}
    </div>
  );
}
