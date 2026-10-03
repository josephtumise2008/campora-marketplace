export interface Rating {
  average: number;
  count: number;
}

export interface University {
  code: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  domain: string;
  campuses: string[];
  studentCount: number;
  storeCount?: number;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  image: string;
  icon: string;
  accent: string;
  order: number;
  featured: boolean;
  status: string;
  productCount?: number;
}

export interface StoreRef {
  _id: string;
  name: string;
  slug: string;
  logo: string;
  cover?: string;
  verification: "pending" | "verified" | "suspended";
  rating: Rating;
  location?: StoreLocation;
  delivery?: StoreDelivery;
  category?: Category;
}

export interface StoreLocation {
  city: string;
  state: string;
  address: string;
  zip: string;
  universities: string[];
}

export interface StoreDelivery {
  fee: number;
  freeThreshold: number;
  etaMinutes: number;
  methods: string[];
  minimumOrder: number;
}

export interface StoreHour {
  day: string;
  open: string;
  close: string;
  closed?: boolean;
}

export interface Store {
  _id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logo: string;
  cover: string;
  category: Category;
  categories: Category[];
  owner?: { name: string; avatar: string };
  verification: "pending" | "verified" | "suspended";
  status: string;
  rating: Rating;
  location: StoreLocation;
  delivery: StoreDelivery;
  contact: { email: string; phone: string };
  hours: StoreHour[];
  policies: { returns: string; delivery: string; substitutions: string };
  promo: { headline: string; code: string; discountPercent: number };
  featured: boolean;
  stats: {
    orders: number;
    revenue: number;
    products: number;
    repeatRate?: number;
    unitsSold?: number;
    reviews?: number;
  };
  createdAt?: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  details: string;
  price: number;
  compareAtPrice: number;
  discountPercent?: number;
  images: string[];
  store: StoreRef;
  category: Category;
  rating: Rating;
  stock: number;
  sku: string;
  tags: string[];
  specs: ProductSpec[];
  status: string;
  unit: string;
  deal: { isDeal: boolean; badge: string };
  featured: boolean;
  soldCount: number;
  createdAt?: string;
}

export interface ProductDetail extends Product {
  store: StoreRef & {
    cover: string;
    tagline: string;
    contact: Store["contact"];
    location: StoreLocation;
    delivery: StoreDelivery;
    policies: Store["policies"];
    hours: StoreHour[];
    promo: Store["promo"];
  };
}

export interface CartLine {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  storeId: string;
  storeName: string;
  storeSlug: string;
  stock: number;
  unit?: string;
  categoryName?: string;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  tax: number;
  serviceFee: number;
  deliveryFee: number;
  total: number;
}

export interface OrderItem {
  product: string | { _id: string; name: string; images: string[] };
  store: string | StoreRef;
  storeName: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  lineTotal: number;
  status: OrderStatus;
}

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Preparing"
  | "Ready"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export interface Order {
  _id: string;
  orderNumber: string;
  customer: string | { _id: string; name: string; email: string; avatar: string };
  items: OrderItem[];
  status: OrderStatus;
  totals: CartTotals;
  deliveryAddress: {
    recipient: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    instructions: string;
  };
  deliveryMethod: string;
  payment: {
    method: string;
    status: string;
    brand: string;
    last4: string;
    simulated: boolean;
    reference: string;
  };
  customerNote: string;
  timeline: { status: string; label: string; note: string; at: string }[];
  placedAt: string;
  createdAt: string;
  deliveredAt?: string;
  storeSubtotal?: number;
}

export interface Review {
  _id: string;
  product: string | { _id: string; name: string; images: string[] };
  store: string | StoreRef;
  user: { _id: string; name: string; avatar: string };
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface Address {
  _id: string;
  label: string;
  recipient: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  instructions: string;
  type: string;
  isDefault: boolean;
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "customer" | "seller" | "admin";
  phone: string;
  avatar: string;
  bio: string;
  university: { code: string; name: string };
  store: StoreRef | null;
  addresses?: Address[];
  wishlist?: string[];
  favoriteStores?: string[];
  recentSearches?: string[];
  notificationPrefs?: {
    orderUpdates: boolean;
    deals: boolean;
    priceDrops: boolean;
    campusDigest: boolean;
  };
  paymentPrefs?: {
    savedCardBrand: string;
    savedCardLast4: string;
    savedCardExpiry: string;
    demoMode: boolean;
  };
  createdAt?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface SearchSuggestion {
  type: "product" | "store" | "category";
  id: string;
  label: string;
  sublabel: string;
  image: string;
  price?: number;
  href: string;
}

export interface HomeFeed {
  categories: Category[];
  featuredStores: Store[];
  trending: Product[];
  deals: Product[];
  nearby: Product[];
  newArrivals: Product[];
}

export interface MarketplaceConfig {
  pricing: {
    taxRate: number;
    serviceFeeRate: number;
    defaultDeliveryFee: number;
    freeDeliveryThreshold: number;
  };
  marketplace: { storeCount: number; productCount: number };
  orderStatuses: OrderStatus[];
  paymentMode: string;
}

export interface SellerDashboard {
  store: Store;
  stats: {
    revenue30: number;
    revenuePrevious: number;
    revenueChange: number;
    orders30: number;
    ordersChange: number;
    products: number;
    customers: number;
    averageOrderValue: number;
    averageOrderValuePrevious: number;
    rating: number;
    reviewCount: number;
    repeatRate: number;
  };
  series: { date: string; revenue: number; orders: number }[];
  topProducts: (Product & { revenue: number })[];
  lowStock: { _id: string; name: string; stock: number; images: string[] }[];
  recentOrders: Order[];
  customers: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    orders: number;
    spend: number;
  }[];
}

/** Admin user list rows are raw lean documents, so they keep `_id` and `isActive`. */
export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "customer" | "seller" | "admin";
  avatar: string;
  university: { code: string; name: string };
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  store: { _id: string; name: string; slug: string; logo: string; verification: string } | null;
}

/** Admin store rows include the owner so verifiers know who to contact. */
export interface AdminStore extends Store {
  owner: { name: string; email: string; avatar: string };
}

export interface AdminReports {
  categoryBreakdown: {
    name: string;
    slug: string;
    products: number;
    units: number;
    averagePrice: number;
  }[];
  storePerformance: {
    name: string;
    slug: string;
    logo: string;
    verification: string;
    orders: number;
    revenue: number;
  }[];
  statusBreakdown: { _id: string; count: number; total: number }[];
  topSellers: {
    name: string;
    images: string[];
    price: number;
    soldCount: number;
    store: { name: string; slug: string; logo: string };
  }[];
  revenueByDay: { _id: string; revenue: number }[];
}

export interface AdminOverview {
  stats: {
    customers: number;
    sellers: number;
    stores: number;
    verifiedStores: number;
    pendingStores: number;
    products: number;
    orders: number;
    revenue: number;
    platformFees: number;
    averageOrderValue: number;
    reviews: number;
  };
  series: { date: string; revenue: number; orders: number }[];
  recentOrders: Order[];
  recentUsers: Pick<AdminUser, "name" | "email" | "role" | "avatar" | "university" | "createdAt">[];
  topStores: Store[];
  categories: Category[];
  ordersByStatus: { _id: string; count: number }[];
  topCategories: { _id: string; name: string; slug: string; count: number }[];
}
