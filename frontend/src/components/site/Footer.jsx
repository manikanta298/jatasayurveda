import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin, Twitter, Linkedin } from "lucide-react";
import { useSettings } from "@/lib/settings";
import logo from "@/assets/logos/jata-logo.png";

export function SiteFooter() {
  const { brand, contact, socials, footer } = useSettings();
  const logoSrc = brand.logo_url || logo;
  const brandName = brand.name || "JATA Ayurveda";

  const socialLinks = [
    { url: socials.instagram, Icon: Instagram, label: "Instagram" },
    { url: socials.facebook, Icon: Facebook, label: "Facebook" },
    { url: socials.youtube, Icon: Youtube, label: "YouTube" },
    { url: socials.twitter, Icon: Twitter, label: "Twitter" },
    { url: socials.linkedin, Icon: Linkedin, label: "LinkedIn" },
  ].filter((s) => !!s.url);

  return (
    <footer className="mt-24 border-t border-border bg-[var(--gradient-warm)]">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-2">
          <img src={logoSrc} alt={brandName} className="h-16 w-auto" />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">{brand.tagline}</p>
          {socialLinks.length > 0 && (
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map(({ url, Icon, label }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-border text-foreground/70 transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-display text-lg text-foreground">Explore</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              { to: "/about", label: "About" },
              { to: "/services", label: "Services" },
              { to: "/products", label: "Products" },
              { to: "/research", label: "Research" },
              { to: "/blog", label: "Blog" },
              { to: "/contact", label: "Contact" },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-muted-foreground hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg text-foreground">Get in touch</h4>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {contact.phone && (
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {contact.phone}
              </li>
            )}
            {contact.email && (
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {contact.email}
              </li>
            )}
            {contact.address && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {contact.address}
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 pt-6 text-xs text-muted-foreground sm:px-6 lg:px-8">
          {[
            { to: "/privacy-policy", label: "Privacy Policy" },
            { to: "/refund-policy", label: "Refund Policy" },
            { to: "/return-policy", label: "Return Policy" },
            { to: "/terms-and-conditions", label: "Terms & Conditions" },
            { to: "/shipping-policy", label: "Shipping Policy" },
          ].map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-primary">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>{footer.copyright || `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`}</p>
          <p>{footer.note || "Made with care in India."}</p>
        </div>
      </div>
    </footer>
  );
}
