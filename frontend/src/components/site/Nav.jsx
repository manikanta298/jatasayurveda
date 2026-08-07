import { Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, ShoppingBag, Phone, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSettings } from "@/lib/settings";
import { useCart } from "@/lib/cart";
import { useCustomerAuth } from "@/lib/customerAuth";
import { cn } from "@/lib/utils";
import logo from "@/assets/logos/jata-logo.png";
import { AuthModal } from "./AuthModal";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  // { to: "/services", label: "Medicinal Plants" },
  { to: "/products", label: "Products" },
  // { to: "/research", label: "Research" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authModal, setAuthModal] = useState({ open: false, tab: "login" });
  const { count } = useCart();
  const { brand } = useSettings();
  const { customer, logout } = useCustomerAuth();
  const logoSrc = brand.logo_url || logo;
  const brandName = brand.name || "JATA Ayurveda";

  function openAuth(tab) {
    setOpen(false);
    // Also mark the auto-popup as "shown" so it doesn't pop up on top of a
    // modal the person opened manually (e.g. from the profile menu).
    sessionStorage.setItem("jata_auth_popup_shown", "1");
    setAuthModal({ open: true, tab });
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-open the sign-in/sign-up popup 10 seconds after the site loads, but
  // only once: skip it entirely for signed-in customers, and only ever show
  // it once per browser session (sessionStorage flag) so it doesn't nag on
  // every page navigation or repeat visit within the same session. The
  // popup itself always keeps its normal X close button (from the shared
  // Dialog component), so closing it is always one click away.
  useEffect(() => {
    if (customer) return undefined;
    if (sessionStorage.getItem("jata_auth_popup_shown")) return undefined;

    const timer = setTimeout(() => {
      sessionStorage.setItem("jata_auth_popup_shown", "1");
      setAuthModal({ open: true, tab: "login" });
    }, 10000);

    return () => clearTimeout(timer);
  }, [customer]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-10 w-full transition-all duration-300",
        scrolled ? "glass-nav" : "bg-transparent"
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 rounded-[1.7rem] border border-white/18 bg-white/82 px-4 backdrop-blur-2xl sm:h-18 sm:px-5 lg:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label={brandName}>
            <img src={logoSrc} alt={brandName} className="h-11 w-auto sm:h-12" />
          </Link>

          <nav className="hidden items-center gap-8 xl:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    "gold-underline text-sm font-medium tracking-wide text-foreground/80 transition-colors hover:text-primary",
                    isActive && "text-primary"
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 xl:flex">
            <Button asChild variant="outline" className="rounded-full border-primary/25 bg-white/70 text-primary hover:bg-primary/5">
              <Link to="/contact">
                <Mail className="mr-2 h-4 w-4" />
                Contact
              </Link>
            </Button>
            <Button asChild className="rounded-full bg-primary px-5 text-primary-foreground shadow-[var(--shadow-elegant)] hover:bg-primary/90">
              <Link to="/products">Shop Now</Link>
            </Button>
            <CartButton count={count} />
            <ProfileMenu customer={customer} onLogin={() => openAuth("login")} onRegister={() => openAuth("register")} onLogout={logout} />
          </div>

          <div className="flex items-center gap-2 xl:hidden">
            <CartButton count={count} />
            <ProfileMenu customer={customer} onLogin={() => openAuth("login")} onRegister={() => openAuth("register")} onLogout={logout} />
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border/80 bg-white/70 text-foreground shadow-sm backdrop-blur-xl"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className={cn("xl:hidden", open ? "pointer-events-auto" : "pointer-events-none")}>
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/45 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
        <div
          className={cn(
            "fixed left-0 right-0 top-[4.75rem] z-50 mx-4 rounded-[1.5rem] border border-white/20 bg-background/92 p-4 shadow-[0_25px_80px_-36px_rgba(0,0,0,0.62)] backdrop-blur-2xl transition-all duration-300",
            open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
          )}
        >
          <div className="mb-4 rounded-2xl bg-primary/8 p-3">
            <p className="text-sm font-semibold text-foreground">Explore JATA Ayurveda</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Wellness products, research-backed care, and the latest updates from our clinic.
            </p>
          </div>

          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-xl px-4 py-3 text-base font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-primary",
                    isActive && "bg-primary/10 text-primary"
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button asChild variant="outline" className="rounded-full border-primary/25 bg-white/70 text-primary">
              <Link to="/contact" onClick={() => setOpen(false)}>
                <Phone className="mr-2 h-4 w-4" />
                Contact
              </Link>
            </Button>
            <Button asChild className="rounded-full bg-primary text-primary-foreground">
              <Link to="/products" onClick={() => setOpen(false)}>
                Shop Now
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <AuthModal
        open={authModal.open}
        onOpenChange={(v) => setAuthModal((s) => ({ ...s, open: v }))}
        defaultTab={authModal.tab}
      />
    </header>
  );
}

function ProfileMenu({ customer, onLogin, onRegister, onLogout }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={customer ? `Account menu for ${customer.name}` : "Login or register"}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border/80 bg-white/70 text-foreground shadow-sm backdrop-blur-xl transition hover:text-primary"
        >
          <User className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {customer ? (
          <>
            <DropdownMenuLabel className="truncate">Signed in as {customer.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">My profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout}>Log out</DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel>Your account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogin}>Log in</DropdownMenuItem>
            <DropdownMenuItem onClick={onRegister}>Sign up</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CartButton({ count }) {
  return (
    <Link
      to="/cart"
      aria-label={`Cart (${count} item${count === 1 ? "" : "s"})`}
      className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border/80 bg-white/70 text-foreground shadow-sm backdrop-blur-xl transition hover:text-primary"
    >
      <ShoppingBag className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground shadow">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
