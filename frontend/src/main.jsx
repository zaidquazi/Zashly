import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "stream-chat-react/dist/css/v2/index.css";
import "./index.css";
import App from "./App.jsx";

import { BrowserRouter, MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isNative } from "./lib/platform";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

// In Capacitor native, the app is served from file:// so BrowserRouter
// (which relies on the History API + URL paths) won't work correctly.
// MemoryRouter keeps routing state in memory — works perfectly in WebViews.
const Router = isNative() ? MemoryRouter : BrowserRouter;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <Router>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </Router>
    </HelmetProvider>
  </StrictMode>
);
