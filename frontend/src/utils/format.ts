import type { OrderStatus } from "../types";

export const STORAGE_KEYS = {
  cart: "campora.cart.v1",
  savedCart: "campora.cart.saved.v1",
  university: "campora.university.v1",
  searchHistory: "campora.searches.v1",
  recents: "campora.recents.v1",
} as const;

export const currency = (value: number | undefined | null, options?: { compact?: boolean }) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: options?.compact && amount >= 1000 ? 0 : 2,
    maximumFractionDigits: options?.compact && amount >= 1000 ? 0 : 2,
  }).format(amount);
};

export const numberCompact = (value: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    value || 0
  );

export const discountPercent = (price: number, compareAtPrice: number) => {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};

export const formatDate = (value?: string, style: "short" | "long" = "short") => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US",
    style === "long"
      ? { month: "long", day: "numeric", year: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" }
  ).format(date);
};

export const formatDateTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

export const relativeTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value).getTime();
  if (Number.isNaN(date)) return "";
  const diff = Date.now() - date;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return formatDate(value);
};

export const etaLabel = (minutes?: number) => {
  const value = Number(minutes || 0);
  if (!value) return "Delivery estimate at checkout";
  if (value < 60) return `${value} min`;
  const hours = Math.round((value / 60) * 10) / 10;
  return `${hours} hr`;
};

export const etaRange = (minutes?: number) => {
  const value = Number(minutes || 0);
  if (!value) return "Delivery estimate at checkout";
  const low = Math.max(5, Math.round(value * 0.75));
  const high = Math.round(value * 1.4);
  return `${low}–${high} min`;
};

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Ready",
  "Out for Delivery",
  "Delivered",
];

export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  Pending: "badge--warning",
  Confirmed: "badge--brand-soft",
  Preparing: "badge--brand-soft",
  Ready: "badge--brand",
  "Out for Delivery": "badge--accent-soft",
  Delivered: "badge--success",
  Cancelled: "badge--danger",
};

export const nextOrderStatus = (status: OrderStatus): OrderStatus[] => {
  const map: Record<OrderStatus, OrderStatus[]> = {
    Pending: ["Confirmed", "Cancelled"],
    Confirmed: ["Preparing", "Cancelled"],
    Preparing: ["Ready", "Cancelled"],
    Ready: ["Out for Delivery", "Delivered", "Cancelled"],
    "Out for Delivery": ["Delivered"],
    Delivered: [],
    Cancelled: [],
  };
  return map[status] || [];
};

export const stockTone = (stock: number) => {
  if (stock <= 0) return { label: "Out of stock", className: "badge--danger" };
  if (stock <= 5) return { label: `Only ${stock} left`, className: "badge--warning" };
  if (stock <= 12) return { label: `${stock} in stock`, className: "badge--neutral" };
  return { label: "In stock", className: "badge--success" };
};

export const initials = (name?: string) =>
  (name || "Campora")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

export const pluralize = (count: number, singular: string, plural?: string) =>
  `${count} ${count === 1 ? singular : plural || `${singular}s`}`;

export const cx = (...values: (string | false | null | undefined)[]) =>
  values.filter(Boolean).join(" ");

export const readStorage = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const writeStorage = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — the app still works, it just will not persist */
  }
};

export const ratingLabel = (average: number) => {
  if (average >= 4.8) return "Excellent";
  if (average >= 4.4) return "Very good";
  if (average >= 4) return "Good";
  if (average >= 3.4) return "Mixed";
  return "Needs work";
};

export const SORTS = [
  { value: "recommended", label: "Recommended" },
  { value: "popular", label: "Most popular" },
  { value: "newest", label: "Newest arrivals" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Highest rated" },
  { value: "deals", label: "Deals first" },
] as const;

export const buildQueryString = (
  params: Record<string, string | number | boolean | undefined | null>
) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === false) return;
    search.set(key, String(value));
  });
  const str = search.toString();
  return str ? `?${str}` : "";
};
