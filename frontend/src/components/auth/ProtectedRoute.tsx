import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PageLoader } from "../ui/Feedback";
import type { User } from "../../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: User["role"][];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader label="Checking your session" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  if (roles && !roles.includes(user!.role)) {
    const fallback = user!.role === "admin" ? "/admin" : user!.role === "seller" ? "/seller" : "/account";
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
