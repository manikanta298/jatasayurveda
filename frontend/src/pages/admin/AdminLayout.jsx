import { useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  LayoutDashboard, Package, Shield, LogOut, ExternalLink, Newspaper,
  Settings as SettingsIcon, ShoppingBag, Sparkles, Tag,
} from "lucide-react";
import { getMe, logout } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/logos/jata-logo.png";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: Package, exact: false },
  { to: "/admin/products", label: "Products", icon: ShoppingBag, exact: false },
  { to: "/admin/categories", label: "Categories", icon: Tag, exact: false },
  { to: "/admin/services", label: "Services", icon: Sparkles, exact: false },
  { to: "/admin/blog", label: "Blog", icon: Newspaper, exact: false },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon, exact: false },
  { to: "/admin/users", label: "Users & Roles", icon: Shield, exact: false },
];

// Any of these roles gets into the admin panel — each page/endpoint enforces
// its own finer-grained role requirement server-side (see MIGRATION_PLAN.md,
// Phase 3). This replaces the original's single "admin role only" gate, since
// this backend supports 5 distinct staff roles rather than one.
const STAFF_ROLES = ["admin", "content_manager", "product_manager", "order_manager", "marketing_manager"];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      navigate("/auth", { replace: true });
    }
  }, [isLoading, isError, user, navigate]);

  if (isLoading) {
    return <div className="grid min-h-[60vh] place-items-center text-muted-foreground">Verifying access…</div>;
  }

  if (isError || !user) {
    return null;
  }

  const isStaff = user.roles?.some((r) => STAFF_ROLES.includes(r));

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    try {
      await logout();
    } catch {
      // proceed to sign the user out client-side regardless
    }
    navigate("/auth", { replace: true });
  }

  if (!isStaff) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <h1 className="font-display text-2xl">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account is signed in but doesn't have admin access.
        </p>
        <Button className="mt-4 rounded-full" onClick={handleSignOut}>Sign out</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8">
        <aside className="lg:w-60 lg:shrink-0">
          <div className="sticky top-4 rounded-2xl border border-border bg-card p-4">
            <Link to="/" className="flex items-center gap-2 pb-4">
              <img src={logo} alt="JATA" className="h-8 w-auto" />
            </Link>
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => {
                const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 border-t border-border pt-4">
              <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
                <ExternalLink className="h-4 w-4" /> View site
              </Link>
              <button onClick={handleSignOut} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
