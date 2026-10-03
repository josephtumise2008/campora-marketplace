import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "../components/common/Navbar";
import { Footer } from "../components/common/Footer";
import { CartDrawer } from "../components/common/CartDrawer";
import { PageLoader } from "../components/ui/Feedback";
import { useBodyScrollLock } from "../hooks/useAsync";

/** Reset scroll on route change (except when restoring browser history). */
function ScrollToTop() {
  const { pathname, key } = useLocation();
  useEffect(() => {
    if (window.location.hash) return;
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, key]);
  return null;
}

export function RootLayout() {
  const { pathname } = useLocation();
  const isCheckout = pathname.startsWith("/checkout");
  useBodyScrollLock(false);

  return (
    <div className="app-shell">
      <ScrollToTop />
      <Navbar />
      <main id="main" className={isCheckout ? "app-main app-main--checkout" : "app-main"}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

export function BareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell app-shell--bare">
      <main id="main" className="app-main">
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </main>
    </div>
  );
}
