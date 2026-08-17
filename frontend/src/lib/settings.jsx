import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSettings } from "./queries";

export const DEFAULT_SETTINGS = {
  brand: {
    name: "JATA Ayurveda",
    tagline: "Timeless Wellness, Rooted in Modern Science",
    logo_url: null,
    favicon_url: null,
  },
  contact: {
    phone: "+91 90000 00000",
    email: "care@jataayurveda.com",
    whatsapp: "+91 90000 00000",
    address: "JATA Ayurveda Centre, Bengaluru, Karnataka, India",
    business_hours: "Mon–Sat · 9:00 AM – 7:00 PM",
    google_maps_embed_url: null,
  },
  socials: {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    youtube: "https://youtube.com/",
    twitter: null,
    linkedin: null,
  },
  seo: {
    default_title: "JATA Ayurveda — Timeless Wellness, Rooted in Modern Science",
    default_description:
      "Physician-led Ayurvedic care, Panchakarma programmes, and premium herbal products.",
    default_og_image: null,
  },
  analytics: { ga_measurement_id: null, gtm_container_id: null },
  commerce: {
    currency: "INR",
    free_shipping_over_paise: 99900,
    flat_shipping_paise: 7900,
    gst_percent: 0,
  },
  footer: {
    copyright: "© JATA Ayurveda. All rights reserved.",
    note: "Registered as JATAS Ayurvedic Healthcare Systems LLP.",
  },
  home_hero: {
    eyebrow_line1: "JATA",
    eyebrow_line2: "Ayurveda",
    heading: "Experience Modern Ayurvedic Healthcare",
    description:
      "Scientific Research Meets Natural Wellness at JATA Ayurveda. Discover Trustworthy Solutions for Holistic Well-being.",
    primary_cta_label: "Book Consultation",
    primary_cta_href: "/consultation",
    secondary_cta_label: "Shop Ayurvedic Products",
    secondary_cta_href: "/products",
    // Unlimited hero slider media (images/video), managed exclusively from
    // Admin → Settings → Home hero section and persisted in MongoDB. Empty
    // by default — HeroSection renders no image/video (and no bundled
    // fallback) until an admin uploads at least one slide.
    slides: [],
    badges: [
      { icon: "ShieldCheck", label: "Certified Ayurvedic Medicine" },
      { icon: "BadgeCheck", label: "GMP Compliant" },
      { icon: "Award", label: "ISO Certified" },
    ],
    stats: [
      { value: "20+", suffix: "YRS", label: "Years of Experience" },
      { value: "10,000+", suffix: "", label: "Happy Patients" },
      { value: "50+", suffix: "", label: "Research-Based Formulations" },
      { value: "100+", suffix: "", label: "Certified Products" },
    ],
    floating_tags: [
      { icon: "Stethoscope", label: "Personalized Treatment Plans" },
      { icon: "BadgeCheck", label: "Clinically Proven Remedies" },
      { icon: "Users", label: "Trusted by 10,000+ Patients" },
    ],
  },
  about_intro: {
    eyebrow: "About Jatas Ayurvedic Healthcare Systems LLP",
    heading: "Rooted in Ayurveda. Driven by",
    heading_highlight: "Research.",
    description:
      "At Jatas Ayurvedic Healthcare Systems LLP, we believe true wellness begins with nature. Established in Kakinada, Andhra Pradesh, we combine the timeless wisdom of Ayurveda with modern scientific research — developing innovative herbal products, promoting medicinal plant conservation, supporting farmers, and strengthening the AYUSH ecosystem.",
    images: [],
  },
  site: {
    maintenance_mode: false,
    maintenance_message: "We are performing scheduled maintenance. We'll be back shortly.",
  },
};

async function fetchAllSettings() {
  try {
    const data = await getSettings();
    const merged = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    for (const key of Object.keys(data || {})) {
      if (key in merged) merged[key] = { ...merged[key], ...data[key] };
    }
    return merged;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const SettingsContext = createContext(DEFAULT_SETTINGS);

export function SettingsProvider({ children }) {
  // IMPORTANT: this must be `placeholderData`, not `initialData`.
  //
  // `initialData` seeds the query cache itself and — combined with
  // `staleTime` — is treated as if it had just been freshly fetched. That
  // meant every fresh page load (a new QueryClient, e.g. after a hard
  // refresh) considered DEFAULT_SETTINGS "fresh" for a full 60 seconds and
  // skipped the real network request entirely, so admin-saved data (like
  // uploaded hero slides) never loaded until something else invalidated the
  // query. `placeholderData` shows the same default content immediately
  // (no loading flash) WITHOUT marking it as cached/fresh, so the real
  // fetch to /settings always runs on mount and the DB-backed values
  // (e.g. home_hero.slides) load reliably on every refresh.
  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchAllSettings,
    staleTime: 60_000,
    placeholderData: DEFAULT_SETTINGS,
  });
  return <SettingsContext.Provider value={data}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
