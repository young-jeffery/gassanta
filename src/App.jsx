import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Join from "./pages/Join";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import GroupComingSoon from "./pages/GroupComingSoon";
import Home from "./pages/Home";
import RequireAuth from "./routes/RequireAuth";
import RedirectIfAuthed from "./routes/RedirectIfAuthed";
import RequireGroup from "./routes/RequireGroup";
import DashboardRedirect from "./routes/DashboardRedirect";

// Every page renders inside <Layout> (snow, glow, dock).
// Route map:
//   /                       landing (public)
//   /register               create an account + join a group with a code (public; not wrapped, see RedirectIfAuthed)
//   /login, /forgot         only for signed-out visitors
//   /join                   signed in: join another group with a code
//   /dashboard              redirects to the last-used group's dashboard (or /join if you're in none)
//   /g/:slug/dashboard      members of that group only (RequireGroup)
//   /g/:slug/preferences    placeholder until Stage 5;  /g/:slug/reveal  placeholder until Stage 7;  Stage 4 adds /admin
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="register" element={<Register />} />

        <Route element={<RedirectIfAuthed />}>
          <Route path="login" element={<Login />} />
          <Route path="forgot" element={<ForgotPassword />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="join" element={<Join />} />
          <Route path="dashboard" element={<DashboardRedirect />} />
          <Route path="g/:slug" element={<RequireGroup />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="preferences" element={<GroupComingSoon title="Preferences" />} />
            <Route path="reveal" element={<GroupComingSoon title="Your reveal" />} />
          </Route>
        </Route>

        {/* Stage 1 test page, kept for checking palette tokens. Removed in the 3.5 cleanup. */}
        <Route path="foundation-test" element={<Home />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
