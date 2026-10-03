import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { orderService, type OrderQuote } from "../services/marketplace";
import { STORAGE_KEYS, readStorage, writeStorage } from "../utils/format";
import type { CartLine, Product } from "../types";
import { useToast } from "./ToastContext";

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  saved: CartLine[];
  add: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  saveForLater: (productId: string) => void;
  moveToCart: (productId: string) => void;
  removeSaved: (productId: string) => void;
  inCart: (productId: string) => boolean;
  quantityOf: (productId: string) => number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  quote: OrderQuote | null;
  quoteLoading: boolean;
  refreshQuote: (deliveryMethod?: "Delivery" | "Pickup") => Promise<void>;
  error: string | null;
}

const CartContext = createContext<CartContextValue | null>(null);

const toLine = (product: Product, quantity: number): CartLine => ({
  productId: product._id,
  name: product.name,
  image: product.images?.[0] || "",
  price: product.price,
  quantity,
  storeId: product.store?._id || product.store?.slug || "",
  storeName: product.store?.name || "Campus store",
  storeSlug: product.store?.slug || "",
  stock: product.stock ?? 0,
  unit: product.unit,
  categoryName: product.category?.name,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [lines, setLines] = useState<CartLine[]>(() => readStorage(STORAGE_KEYS.cart, [] as CartLine[]));
  const [saved, setSaved] = useState<CartLine[]>(() =>
    readStorage(STORAGE_KEYS.savedCart, [] as CartLine[])
  );
  const [isOpen, setIsOpen] = useState(false);
  const [quote, setQuote] = useState<OrderQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => writeStorage(STORAGE_KEYS.cart, lines), [lines]);
  useEffect(() => writeStorage(STORAGE_KEYS.savedCart, saved), [saved]);

  const count = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);
  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [lines]
  );

  const add = useCallback(
    (product: Product, quantity = 1) => {
      setLines((current) => {
        const existing = current.find((line) => line.productId === product._id);
        if (existing) {
          return current.map((line) =>
            line.productId === product._id
              ? { ...line, quantity: Math.min(line.quantity + quantity, Math.max(product.stock, 1)) }
              : line
          );
        }
        const wanted = Math.min(quantity, Math.max(product.stock, 1));
        return [...current, toLine(product, wanted)];
      });
      toast.addedToCart(product.name, product.images?.[0]);
    },
    [toast]
  );

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((current) =>
      current
        .map((line) =>
          line.productId === productId
            ? { ...line, quantity: Math.min(Math.max(quantity, 0), Math.max(line.stock, 1)) }
            : line
        )
        .filter((line) => line.quantity > 0)
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((current) => current.filter((line) => line.productId !== productId));
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setQuote(null);
    setError(null);
  }, []);

  const saveForLater = useCallback((productId: string) => {
    setLines((current) => {
      const target = current.find((line) => line.productId === productId);
      if (!target) return current;
      setSaved((prev) => (prev.some((line) => line.productId === productId) ? prev : [...prev, target]));
      return current.filter((line) => line.productId !== productId);
    });
    toast.info("Moved to saved for later");
  }, [toast]);

  const moveToCart = useCallback(
    (productId: string) => {
      setSaved((current) => {
        const target = current.find((line) => line.productId === productId);
        if (!target) return current;
        setLines((prev) =>
          prev.some((line) => line.productId === productId)
            ? prev
            : [...prev, { ...target, quantity: Math.min(1, Math.max(target.stock, 1)) }]
        );
        return current.filter((line) => line.productId !== productId);
      });
    },
    []
  );

  const removeSaved = useCallback((productId: string) => {
    setSaved((current) => current.filter((line) => line.productId !== productId));
  }, []);

  const refreshQuote = useCallback(async (deliveryMethod: "Delivery" | "Pickup" = "Delivery") => {
    if (!lines.length) {
      setQuote(null);
      return;
    }
    setQuoteLoading(true);
    setError(null);
    try {
      const result = await orderService.quote({
        items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        deliveryMethod,
      });
      setQuote(result);
    } catch (err) {
      setQuote(null);
      setError(err instanceof Error ? err.message : "We could not price your cart.");
    } finally {
      setQuoteLoading(false);
    }
  }, [lines]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshQuote();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [refreshQuote]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count,
      subtotal,
      saved,
      add,
      setQuantity,
      remove,
      clear,
      saveForLater,
      moveToCart,
      removeSaved,
      inCart: (productId) => lines.some((line) => line.productId === productId),
      quantityOf: (productId) => lines.find((line) => line.productId === productId)?.quantity || 0,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      quote,
      quoteLoading,
      refreshQuote,
      error,
    }),
    [
      lines,
      count,
      subtotal,
      saved,
      add,
      setQuantity,
      remove,
      clear,
      saveForLater,
      moveToCart,
      removeSaved,
      isOpen,
      quote,
      quoteLoading,
      refreshQuote,
      error,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
