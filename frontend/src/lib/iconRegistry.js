import {
  ShieldCheck,
  BadgeCheck,
  Award,
  Stethoscope,
  Users,
  HeartPulse,
  Leaf,
  Sparkles,
  FlaskConical,
  Star,
  Heart,
  Compass,
} from "lucide-react";

// Badges/tags stored in site settings reference an icon by name (a plain
// string, since JSON can't hold a component reference). This registry is the
// single source of truth mapping those names to actual lucide-react
// components — used both when rendering the public site and when building
// the admin's icon picker dropdown.
export const ICON_REGISTRY = {
  ShieldCheck,
  BadgeCheck,
  Award,
  Stethoscope,
  Users,
  HeartPulse,
  Leaf,
  Sparkles,
  FlaskConical,
  Star,
  Heart,
  Compass,
};

export const ICON_NAMES = Object.keys(ICON_REGISTRY);

// Falls back to Sparkles for an unrecognized/missing icon name so a bad or
// stale value in stored settings never breaks rendering.
export function resolveIcon(name) {
  return ICON_REGISTRY[name] || Sparkles;
}
