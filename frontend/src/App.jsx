import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SiteNav } from "@/components/site/Nav";
import { SiteFooter } from "@/components/site/Footer";

// Tells the boot loader in index.html the first real page has actually
// mounted (not just that App/Nav/Footer rendered). Placed as a sibling of
// <Outlet/> inside the same Suspense boundary below, so React only mounts it
// once that boundary has resolved to real content — never while still
// showing the fallback for a not-yet-loaded route chunk. Safe to fire again
// on later navigations (the listener in index.html only acts on the first
// call), so no special-casing is needed here.
function AppReadySignal() {
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("app:ready"));
      });
    });
  }, []);
  return null;
}

// Shown only for in-app navigations to a route chunk that hasn't loaded yet
// (e.g. clicking a nav link for the first time). Never visible during the
// very first page load — the full-screen boot loader in index.html already
// covers the screen at that point.
function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const isChromeless = pathname.startsWith("/admin") || pathname === "/auth";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {!isChromeless && <SiteNav />}
      <main className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
          <AppReadySignal />
        </Suspense>
      </main>
      {!isChromeless && <SiteFooter />}
    </div>
  );
}
