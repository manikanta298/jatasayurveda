import { Instagram, Facebook, Youtube, Twitter, Linkedin } from "lucide-react";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

// Reads the socials that are configured in Admin → Settings and renders
// whichever of them have a URL set. Used by the footer (site-wide).
//
// Pass `links` to render a specific set instead — e.g. a blog post's own
// `socialLinks` (Admin → Blog → edit post → "Social media links") take
// priority over the site-wide ones when a post has any set.
export function SocialLinks({ className, links }) {
  const { socials } = useSettings();
  const source = links || socials;

  const items = [
    { url: source.instagram, Icon: Instagram, label: "Instagram" },
    { url: source.facebook, Icon: Facebook, label: "Facebook" },
    { url: source.youtube, Icon: Youtube, label: "YouTube" },
    { url: source.twitter, Icon: Twitter, label: "Twitter" },
    { url: source.linkedin, Icon: Linkedin, label: "LinkedIn" },
  ].filter((s) => !!s.url);

  if (items.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {items.map(({ url, Icon, label }) => (
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
  );
}
