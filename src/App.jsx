import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import RegisterStub from "./pages/RegisterStub";
import Home from "./pages/Home";

// Every page renders inside <Layout> (snow, glow, dock). Later stages add routes here:
// /login, /dashboard, /preferences, /reveal, /admin
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="register" element={<RegisterStub />} />
        {/* Stage 1 test page, kept for checking palette tokens. Delete when no longer needed. */}
        <Route path="foundation-test" element={<Home />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
