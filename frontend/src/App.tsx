import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import { UniversityProvider } from "./context/UniversityContext";
import { WishlistProvider } from "./context/WishlistContext";
import { RootLayout } from "./layouts/RootLayout";
import { AccountLayout } from "./layouts/AccountLayout";
import { SellerLayout } from "./layouts/SellerLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PageLoader } from "./components/ui/Feedback";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";

const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const StorePage = lazy(() => import("./pages/StorePage"));
const StoresPage = lazy(() => import("./pages/StoresPage"));
const DealsPage = lazy(() => import("./pages/DealsPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrderConfirmationPage = lazy(() => import("./pages/OrderConfirmationPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const SellPage = lazy(() => import("./pages/SellPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));

const AccountOverviewPage = lazy(() => import("./pages/account/AccountOverviewPage"));
const AccountOrdersPage = lazy(() => import("./pages/account/AccountOrdersPage"));
const AccountOrderDetailPage = lazy(() => import("./pages/account/AccountOrderDetailPage"));
const AccountWishlistPage = lazy(() => import("./pages/account/AccountWishlistPage"));
const AccountAddressesPage = lazy(() => import("./pages/account/AccountAddressesPage"));
const AccountNotificationsPage = lazy(() => import("./pages/account/AccountNotificationsPage"));
const AccountSettingsPage = lazy(() => import("./pages/account/AccountSettingsPage"));

const SellerDashboardPage = lazy(() => import("./pages/seller/SellerDashboardPage"));
const SellerProductsPage = lazy(() => import("./pages/seller/SellerProductsPage"));
const SellerProductFormPage = lazy(() => import("./pages/seller/SellerProductFormPage"));
const SellerOrdersPage = lazy(() => import("./pages/seller/SellerOrdersPage"));
const SellerCustomersPage = lazy(() => import("./pages/seller/SellerCustomersPage"));
const SellerStoreSettingsPage = lazy(() => import("./pages/seller/SellerStoreSettingsPage"));

const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminStoresPage = lazy(() => import("./pages/admin/AdminStoresPage"));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminCategoriesPage = lazy(() => import("./pages/admin/AdminCategoriesPage"));
const AdminReportsPage = lazy(() => import("./pages/admin/AdminReportsPage"));

function RouteFallback() {
  const location = useLocation();
  return <PageLoader label={`Loading ${location.pathname.slice(1) || "page"}`} />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<RootLayout />}>
          {/* Public marketplace */}
          <Route index element={<HomePage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="deals" element={<DealsPage />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="products/:id" element={<ProductPage />} />
          <Route path="stores" element={<StoresPage />} />
          <Route path="stores/:slug" element={<StorePage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order/:id/confirmation" element={<OrderConfirmationPage />} />

          {/* Auth */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />

          {/* Seller onboarding */}
          <Route path="sell" element={<SellPage />} />

          {/* Content */}
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="help" element={<HelpPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />

          {/* Customer account */}
          <Route
            path="account"
            element={
              <ProtectedRoute>
                <AccountLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AccountOverviewPage />} />
            <Route path="orders" element={<AccountOrdersPage />} />
            <Route path="orders/:id" element={<AccountOrderDetailPage />} />
            <Route path="wishlist" element={<AccountWishlistPage />} />
            <Route path="addresses" element={<AccountAddressesPage />} />
            <Route path="notifications" element={<AccountNotificationsPage />} />
            <Route path="settings" element={<AccountSettingsPage />} />
          </Route>

          {/* Seller workspace */}
          <Route
            path="seller"
            element={
              <ProtectedRoute roles={["seller", "admin"]}>
                <SellerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SellerDashboardPage />} />
            <Route path="products" element={<SellerProductsPage />} />
            <Route path="products/new" element={<SellerProductFormPage />} />
            <Route path="products/:id/edit" element={<SellerProductFormPage />} />
            <Route path="orders" element={<SellerOrdersPage />} />
            <Route path="customers" element={<SellerCustomersPage />} />
            <Route path="store" element={<SellerStoreSettingsPage />} />
          </Route>

          {/* Admin console */}
          <Route
            path="admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="stores" element={<AdminStoresPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function ServiceWorkerGuard() {
  useEffect(() => {
    // Keep the tab title in sync with the campus the shopper picked.
    const stored = window.localStorage.getItem("campora.university.v1");
    void stored;
  }, []);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <UniversityProvider>
        <AuthProvider>
          <ToastProvider>
            <CartProvider>
              <WishlistProvider>
                <ServiceWorkerGuard />
                <AppRoutes />
              </WishlistProvider>
            </CartProvider>
          </ToastProvider>
        </AuthProvider>
      </UniversityProvider>
    </BrowserRouter>
  );
}
