import type {
  AdminReports,
  AdminStore,
  AdminUser,
  OrderStatus,
  Paginated,
  Product,
  Store,
} from "../types";
import { api } from "./api";

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

export interface ProductQuery {
  q?: string;
  category?: string;
  store?: string;
  university?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  minRating?: number | string;
  inStock?: string;
  deals?: string;
  delivery?: string;
  sort?: string;
  page?: number;
  limit?: number;
  excludeCategory?: string;
}

export interface ProductFacets {
  stores: Pick<
    Store,
    "name" | "slug" | "logo" | "rating" | "verification"
  >[];
  categories: { name: string; slug: string; icon: string; accent: string; image: string; productCount?: number }[];
  priceRange: { min: number; max: number };
}

export interface SearchResult {
  query: string;
  products: Paginated<Product>;
  stores: Store[];
  categories: { _id: string; name: string; slug: string; image: string; tagline: string }[];
  suggestions: {
    type: "product" | "store" | "category";
    id: string;
    label: string;
    sublabel: string;
    image: string;
    price?: number;
    href: string;
  }[];
  total: number;
}

export interface StoreDetailResult {
  store: Store;
  products: Paginated<Product>;
  reviews: import("../types").Review[];
  ratingBuckets: { _id: number; count: number }[];
  storeCategories: { _id: string; name: string; slug: string; icon: string; accent: string; count: number }[];
}

export interface OrderQuote {
  lines: {
    productId: string;
    store: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    lineTotal: number;
    available: boolean;
    stock: number;
  }[];
  totals: import("../types").CartTotals;
  appliedCode: string;
}

export interface AuthResponse {
  user: import("../types").User;
  token: string;
}

const qs = (params: Record<string, unknown> = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === false) return;
    search.set(key, String(value));
  });
  const str = search.toString();
  return str ? `?${str}` : "";
};

/* ------------------------------------------------------------------ *
 * Marketplace (public)
 * ------------------------------------------------------------------ */

export const marketplaceService = {
  home: (university?: string, limit = 12) =>
    api.get<import("../types").HomeFeed>(`/home${qs({ university, limit })}`),

  config: () => api.get<import("../types").MarketplaceConfig>("/config"),

  universities: () =>
    api.get<{ items: import("../types").University[] }>("/universities").then((d) => d.items),

  categories: () =>
    api.get<{ items: import("../types").Category[] }>("/categories").then((d) => d.items),

  category: (slug: string) =>
    api.get<{ category: import("../types").Category; stats: { stores: number; products: number } }>(
      `/categories/${slug}`
    ),

  products: (query: ProductQuery = {}) =>
    api.get<Paginated<Product>>(`/products${qs(query as Record<string, unknown>)}`),

  productFacets: (query: ProductQuery = {}) =>
    api.get<ProductFacets>(`/products/facets${qs(query as Record<string, unknown>)}`),

  product: (id: string) =>
    api.get<{ product: import("../types").ProductDetail; related: Product[] }>(`/products/${id}`),

  stores: (query: Record<string, unknown> = {}) =>
    api.get<Paginated<Store>>(`/stores${qs(query)}`),

  store: (slug: string, query: Record<string, unknown> = {}) =>
    api.get<StoreDetailResult>(`/stores/${slug}${qs(query)}`),

  search: (q: string, scope = "all", limit = 8) =>
    api.get<SearchResult>(`/search${qs({ q, scope, limit })}`),
};

/* ------------------------------------------------------------------ *
 * Auth & account
 * ------------------------------------------------------------------ */

export const authService = {
  register: (body: Record<string, unknown>) => api.post<AuthResponse>("/auth/register", body),
  login: (body: { email: string; password: string }) =>
    api.post<AuthResponse>("/auth/login", body),
  me: () =>
    api
      .get<{ user: import("../types").User }>("/auth/me")
      .then(({ user }) => {
        // The auth endpoint returns the store as `{ id }`; normalise to `_id`
        // so every screen can treat store references the same way.
        const ref = user.store as (import("../types").StoreRef & { id?: string }) | null;
        if (ref && !ref._id && ref.id) {
          user.store = { ...ref, _id: ref.id };
        }
        return user;
      }),
  updateProfile: (body: Record<string, unknown>) =>
    api.patch<{ user: import("../types").User }>("/auth/me", body).then((d) => d.user),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api.patch<{ message: string }>("/auth/password", body),
  forgotPassword: (email: string) => api.post<{ message: string }>("/auth/forgot-password", { email }),
};

export const userService = {
  addresses: () =>
    api.get<{ items: import("../types").Address[] }>("/users/addresses").then((d) => d.items),
  createAddress: (body: Record<string, unknown>) => api.post("/users/addresses", body),
  updateAddress: (id: string, body: Record<string, unknown>) =>
    api.patch(`/users/addresses/${id}`, body),
  deleteAddress: (id: string) => api.del(`/users/addresses/${id}`),

  wishlist: () =>
    api.get<{ items: Product[]; stores: Store[] }>("/users/wishlist"),
  toggleWishlist: (productId: string) =>
    api.post<{ added: boolean; name: string; count: number }>(`/users/wishlist/${productId}`),

  favorites: () =>
    api.get<{ items: Store[] }>("/users/favorites").then((d) => d.items),
  toggleFavoriteStore: (storeId: string) =>
    api.post<{ following: boolean }>(`/users/favorites/${storeId}`),

  followStore: (storeId: string) =>
    api.post<{ following: boolean }>(`/stores/${storeId}/follow`),

  searches: () =>
    api.get<{ recentSearches: string[] }>("/users/searches").then((d) => d.recentSearches),
  pushSearch: (term: string) =>
    api.post<{ recentSearches: string[] }>("/users/searches", { term }),
  clearSearches: () => api.del<{ recentSearches: string[] }>("/users/searches"),

  notifications: () =>
    api.get<{ items: import("../types").Notification[]; unread: number }>("/users/notifications"),
  markNotificationsRead: () => api.patch("/users/notifications/read"),
};

/* ------------------------------------------------------------------ *
 * Orders
 * ------------------------------------------------------------------ */

export interface CheckoutPayload {
  items: { productId: string; quantity: number }[];
  deliveryAddress: Record<string, string>;
  deliveryMethod: string;
  payment: { method: string; cardNumber?: string; expiry?: string; cvc?: string };
  customerNote?: string;
  promotion?: { code: string; discountPercent?: number };
  scheduledFor?: string;
}

export const orderService = {
  quote: (body: { items: { productId: string; quantity: number }[]; deliveryMethod?: string; promotion?: { code: string } }) =>
    api.post<OrderQuote>("/orders/quote", body),
  create: (body: CheckoutPayload) => api.post<{ order: import("../types").Order }>("/orders", body).then((d) => d.order),
  mine: (query: Record<string, unknown> = {}) =>
    api.get<Paginated<import("../types").Order>>(`/orders/mine${qs(query)}`),
  one: (id: string) =>
    api.get<{ order: import("../types").Order }>(`/orders/${id}`).then((d) => d.order),
  cancel: (id: string) =>
    api.patch<{ order: import("../types").Order }>(`/orders/${id}/cancel`),
  storeOrders: (query: Record<string, unknown> = {}) =>
    api.get<Paginated<import("../types").Order>>(`/orders/store${qs(query)}`),
  updateStatus: (id: string, status: OrderStatus) =>
    api.patch<{ order: import("../types").Order }>(`/orders/${id}/status`, { status }),
};

/* ------------------------------------------------------------------ *
 * Reviews
 * ------------------------------------------------------------------ */

export const reviewService = {
  forProduct: (productId: string, page = 1) =>
    api.get<{
      product: { _id: string; name: string; rating: { average: number; count: number } };
      reviews: Paginated<import("../types").Review>;
      ratingBuckets: { _id: number; count: number }[];
      userReview: import("../types").Review | null;
    }>(`/reviews/product/${productId}${qs({ page })}`),
  forStore: (storeId: string, page = 1) =>
    api.get<{
      store: { _id: string; name: string; rating: { average: number; count: number } };
      reviews: Paginated<import("../types").Review>;
      ratingBuckets: { _id: number; count: number }[];
    }>(`/reviews/store/${storeId}${qs({ page })}`),
  create: (body: { productId: string; rating: number; title?: string; comment?: string }) =>
    api.post("/reviews", body),
  update: (id: string, body: { rating: number; title?: string; comment?: string }) =>
    api.patch(`/reviews/${id}`, body),
  remove: (id: string) => api.del(`/reviews/${id}`),
  mine: () => api.get<{ items: import("../types").Review[] }>("/reviews/mine").then((d) => d.items),
};

/* ------------------------------------------------------------------ *
 * Seller
 * ------------------------------------------------------------------ */

export const sellerService = {
  dashboard: () => api.get<import("../types").SellerDashboard>("/seller/dashboard"),
  customers: () =>
    api.get<{
      items: {
        id: string;
        name: string;
        email: string;
        avatar: string;
        orders: number;
        spend: number;
        averageOrderValue: number;
        lastOrderAt: string;
      }[];
      summary: { total: number; repeat: number; averageOrderValue: number; lifetimeValue: number };
    }>("/seller/customers"),
  myStore: () => api.get<{ store: Store }>("/stores/mine").then((d) => d.store),
  updateStore: (body: Record<string, unknown>) => api.patch<{ store: Store }>("/stores/mine", body),
  applyForStore: (body: Record<string, unknown>) =>
    api.post<{ store: Store }>("/stores/apply", body).then((d) => d.store),
  myProducts: (query: Record<string, unknown> = {}) =>
    api.get<Paginated<Product> & { store: Store }>(`/products/mine${qs(query)}`),
  createProduct: (body: Record<string, unknown>) =>
    api.post<{ product: Product }>("/products", body).then((d) => d.product),
  updateProduct: (id: string, body: Record<string, unknown>) =>
    api.patch<{ product: Product }>(`/products/${id}`, body).then((d) => d.product),
  deleteProduct: (id: string) => api.del<{ message: string }>(`/products/${id}`),
  orders: (query: Record<string, unknown> = {}) =>
    api.get<Paginated<import("../types").Order>>(`/orders/store${qs(query)}`),
  setOrderStatus: (id: string, status: OrderStatus) =>
    api.patch<{ order: import("../types").Order }>(`/orders/${id}/status`, { status }),
};

/* ------------------------------------------------------------------ *
 * Admin
 * ------------------------------------------------------------------ */

export const adminService = {
  overview: () => api.get<import("../types").AdminOverview>("/admin/overview"),
  users: (query: Record<string, unknown> = {}) =>
    api.get<Paginated<AdminUser>>(`/admin/users${qs(query)}`),
  updateUser: (id: string, body: { role?: string; isActive?: boolean }) =>
    api.patch(`/admin/users/${id}`, body),
  stores: (query: Record<string, unknown> = {}) =>
    api.get<Paginated<AdminStore>>(`/admin/stores${qs(query)}`),
  setStoreVerification: (id: string, body: { verification?: string; status?: string; featured?: boolean }) =>
    api.patch<{ store: Store }>(`/admin/stores/${id}`, body).then((d) => d.store),
  products: (query: Record<string, unknown> = {}) =>
    api.get<Paginated<Product>>(`/admin/products${qs(query)}`),
  orders: (query: Record<string, unknown> = {}) =>
    api.get<Paginated<import("../types").Order>>(`/admin/orders${qs(query)}`),
  setOrderStatus: (id: string, status: OrderStatus) =>
    api.patch<{ order: import("../types").Order }>(`/admin/orders/${id}/status`, { status }),
  reports: () => api.get<AdminReports>("/admin/reports"),
  createCategory: (body: Record<string, unknown>) => api.post("/admin/categories", body),
  updateCategory: (id: string, body: Record<string, unknown>) => api.patch(`/admin/categories/${id}`, body),
  deleteCategory: (id: string) => api.del(`/admin/categories/${id}`),
  recountCategories: () => api.post<{ message: string }>("/admin/categories/recount"),
};
