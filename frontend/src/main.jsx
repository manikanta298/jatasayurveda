import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { SettingsProvider } from "./lib/settings";
import { CartProvider } from "./lib/cart";
import { CustomerAuthProvider } from "./lib/customerAuth";
import { ErrorBoundary } from "./components/ErrorBoundary";
import AppRouter from "./router";
import { installPasswordGuard } from "./lib/passwordGuard";
import "./styles.css";
import "./mobile-cart-checkout.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <SettingsProvider>
            <CustomerAuthProvider>
              <CartProvider>
                <AppRouter />
                <Toaster position="top-center" richColors />
              </CartProvider>
            </CustomerAuthProvider>
          </SettingsProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);

installPasswordGuard();

// Note: the app:ready signal that hides the boot loader (see index.html) is
// no longer dispatched here. With routes now lazy-loaded (router.jsx), this
// top-level render() call commits before any actual page content has
// downloaded — dispatching here would hide the loader over a blank page.
// It's now dispatched from inside App.jsx, once the matched route's lazy
// chunk has actually loaded and mounted.
