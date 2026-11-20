import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import RouteLoading from "./RouteLoading";

// Wrap pages that make no sense once signed in (/login, /forgot). Signed-in visitors are sent to where they were
// headed (state.from, set by RequireAuth) or to /dashboard.
//
// NOT used on /register on purpose: creating an account signs the person in half-way through registration, and the
// register page must finish writing their profile before anything navigates away.
export default function RedirectIfAuthed() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <RouteLoading />;
  if (status === "signedIn") return <Navigate to={location.state?.from || "/dashboard"} replace />;
  return <Outlet />;
}
