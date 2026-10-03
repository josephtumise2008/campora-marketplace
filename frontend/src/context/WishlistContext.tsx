import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { userService } from "../services/marketplace";
import type { Product, Store } from "../types";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

interface WishlistContextValue {
  products: Product[];
  stores: Store[];
  productIds: string[];
  storeIds: string[];
  loading: boolean;
  hasProduct: (productId: string) => boolean;
  hasStore: (storeId: string) => boolean;
  toggleProduct: (product: Product) => Promise<void>;
  toggleStore: (store: Store) => Promise<void>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

const idsOf = (items: Array<{ _id: string }>) => items.map((item) => item._id);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setProducts([]);
      setStores([]);
      return;
    }
    setLoading(true);
    try {
      const [wishlist, favorites] = await Promise.all([userService.wishlist(), userService.favorites()]);
      setProducts(wishlist.items);
      setStores(favorites);
    } catch (err) {
      toast.error("We could not load your saved items", err instanceof Error ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, toast]);

  useEffect(() => {
    // Signing in or out changes the account on the server, so the saved list has
    // to be re-read from it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!authLoading) void refresh();
  }, [authLoading, refresh]);

  const toggleProduct = useCallback(
    async (product: Product) => {
      if (!isAuthenticated) {
        toast.info("Sign in to save items", "Your saved list lives with your Campora account.");
        return;
      }
      try {
        const result = await userService.toggleWishlist(product._id);
        setProducts((current) =>
          result.added
            ? [product, ...current.filter((item) => item._id !== product._id)]
            : current.filter((item) => item._id !== product._id)
        );
        toast.success(result.added ? "Saved to your list" : "Removed from your list", product.name);
      } catch (err) {
        toast.error("Could not update your list", err instanceof Error ? err.message : undefined);
      }
    },
    [isAuthenticated, toast]
  );

  const toggleStore = useCallback(
    async (store: Store) => {
      if (!isAuthenticated) {
        toast.info("Sign in to follow stores", "Following a store keeps its deals in reach.");
        return;
      }
      try {
        const result = await userService.toggleFavoriteStore(store._id);
        setStores((current) =>
          result.following
            ? [store, ...current.filter((item) => item._id !== store._id)]
            : current.filter((item) => item._id !== store._id)
        );
        toast.success(result.following ? `Following ${store.name}` : `Unfollowed ${store.name}`);
      } catch (err) {
        toast.error("Could not update your stores", err instanceof Error ? err.message : undefined);
      }
    },
    [isAuthenticated, toast]
  );

  const productIds = useMemo(() => idsOf(products), [products]);
  const storeIds = useMemo(() => idsOf(stores), [stores]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      products,
      stores,
      productIds,
      storeIds,
      loading,
      hasProduct: (productId) => productIds.includes(productId),
      hasStore: (storeId) => storeIds.includes(storeId),
      toggleProduct,
      toggleStore,
      refresh,
    }),
    [products, stores, productIds, storeIds, loading, toggleProduct, toggleStore, refresh]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used inside WishlistProvider");
  return context;
}
