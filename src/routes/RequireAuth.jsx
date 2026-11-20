import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import RouteLoading from "./RouteLoading";

// Wrap routes that need an account. Signed-out visitors go to /login and are sent back afterwards (state.from).
export default function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <RouteLoading />;
  if (status === "signedOut") {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}
