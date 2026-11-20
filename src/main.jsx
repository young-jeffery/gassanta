import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./lite.css";
import "./lib/lite"; // applies the saved lite-mode setting to <html> before the first paint
import App from "./App.jsx";
import ThemeProvider from "./theme/ThemeProvider.jsx";
import MusicProvider from "./audio/MusicProvider.jsx";
import AuthProvider from "./auth/AuthProvider.jsx";
import GroupProvider from "./groups/GroupProvider.jsx";
import { startPerfMonitor } from "./lib/perf";

// Don't let the browser restore an old scroll position on reload / pull-to-refresh. Pages start at the top.
if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";

// Measures real frame rate and lowers visual quality on devices that struggle (see lib/perf.js)
startPerfMonitor();

// Order matters: GroupProvider needs the router (it reads /g/:slug from the URL) and AuthProvider (who is signed in).
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <MusicProvider>
          <AuthProvider>
            <GroupProvider>
              <App />
            </GroupProvider>
          </AuthProvider>
        </MusicProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
