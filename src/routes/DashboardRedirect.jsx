import { Navigate } from "react-router-dom";
import { useGroup } from "../groups/useGroup";
import RouteLoading from "./RouteLoading";

// /dashboard has no group in its URL, so send people to their last-used group, or to /join if they're in none yet.
export default function DashboardRedirect() {
  const { loading, activeGid } = useGroup();

  if (loading) return <RouteLoading />;
  return <Navigate to={activeGid ? `/g/${activeGid}/dashboard` : "/join"} replace />;
}
