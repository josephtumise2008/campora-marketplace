import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, X, ShoppingBag } from "lucide-react";

export type ToastTone = "success" | "error" | "info" | "cart";

export interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
  image?: string;
  action?: { label: string; to: string };
}

interface ToastContextValue {
  toasts: Toast[];
  notify: (toast: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  addedToCart: (title: string, image?: string) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_ICON = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
  cart: ShoppingBag,
} as const;

const TONE_COLOR: Record<ToastTone, string> = {
  success: "var(--success-500)",
  error: "var(--danger-500)",
  info: "var(--brand-500)",
  cart: "var(--accent-500)",
};

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (toast: Omit<Toast, "id">) => {
      counter += 1;
      const id = counter;
      setToasts((current) => [...current.slice(-3), { ...toast, id }]);
      window.setTimeout(() => dismiss(id), toast.tone === "error" ? 6000 : 4000);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      notify,
      dismiss,
      success: (title, description) => notify({ title, description, tone: "success" }),
      error: (title, description) => notify({ title, description, tone: "error" }),
      info: (title, description) => notify({ title, description, tone: "info" }),
      addedToCart: (title, image) => notify({ title, tone: "cart", image }),
    }),
    [toasts, notify, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="toast-viewport"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = TONE_ICON[toast.tone];
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="toast"
                role="status"
              >
                {toast.image ? (
                  <img className="toast__image" src={toast.image} alt="" loading="lazy" />
                ) : (
                  <span className="toast__icon" style={{ color: TONE_COLOR[toast.tone] }}>
                    <Icon size={18} aria-hidden="true" />
                  </span>
                )}
                <div className="toast__body">
                  <p className="toast__title">{toast.title}</p>
                  {toast.description ? (
                    <p className="toast__description">{toast.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="toast__close"
                  onClick={() => dismiss(toast.id)}
                  aria-label={`Dismiss notification: ${toast.title}`}
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
