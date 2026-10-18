import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import ThemeProvider from "./theme/ThemeProvider.jsx";
import MusicProvider from "./audio/MusicProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <MusicProvider>
          <App />
        </MusicProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
