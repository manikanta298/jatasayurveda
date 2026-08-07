import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings";
import heroAyurvedaImage from "@/assets/images/hero-ayurveda.jpg";

const SLIDE_INTERVAL = 6000;
const SLIDE_STORAGE_KEY = "jatasayurveda-hero-slide";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

function normalizeSlide(slide) {
  if (!slide) return null;
  if (typeof slide === "string") {
    return { kind: "image", url: slide, alt: "" };
  }

  const kind =
    slide.kind ||
    slide.type ||
    (String(slide.mime || "").startsWith("video/") ? "video" : "image");

  const url = slide.url || slide.imageUrl || slide.image_url || slide.src || "";
  if (!url) return null;

  return {
    kind,
    url,
    alt: slide.alt || slide.caption || slide.label || "",
    poster: slide.poster || slide.posterUrl || slide.poster_url || "",
  };
}

function splitHeading(heading) {
  const raw = String(heading || "").trim();
  if (!raw) return ["Pure Ayurveda,", "Pure You"];

  if (raw.includes("\n")) {
    const [first = "", second = ""] = raw
      .split("\n")
      .map((part) => part.trim())
      .filter(Boolean);
    return [first || raw, second || ""];
  }

  const commaParts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (commaParts.length >= 2) {
    return [commaParts[0] + ",", commaParts.slice(1).join(", ")];
  }

  const words = raw.split(/\s+/);
  if (words.length >= 4) {
    const pivot = Math.ceil(words.length / 2);
    return [words.slice(0, pivot).join(" "), words.slice(pivot).join(" ")];
  }

  return [raw, ""];
}

export function HeroSection() {
  const { home_hero: hero } = useSettings();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const fallbackSlide = useMemo(
    () => ({
      kind: "image",
      url: hero.image_url || heroAyurvedaImage,
      alt: hero.image_alt || "JATA Ayurveda wellness banner",
    }),
    [hero.image_alt, hero.image_url]
  );

  const slides = useMemo(() => {
    const next = Array.isArray(hero.slides) ? hero.slides.map(normalizeSlide).filter(Boolean) : [];
    return next.length > 0 ? next : [fallbackSlide];
  }, [fallbackSlide, hero.slides]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.sessionStorage.getItem(SLIDE_STORAGE_KEY);
    const parsed = saved !== null ? Number.parseInt(saved, 10) : Number.NaN;

    if (Number.isInteger(parsed) && parsed >= 0 && parsed < slides.length) {
      setActiveIndex(parsed);
    } else {
      setActiveIndex(0);
    }

    setIsReady(true);
  }, [slides.length]);

  useEffect(() => {
    if (typeof window === "undefined" || !isReady || slides.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % slides.length;
        window.sessionStorage.setItem(SLIDE_STORAGE_KEY, String(nextIndex));
        return nextIndex;
      });
    }, SLIDE_INTERVAL);

    return () => window.clearInterval(timer);
  }, [isReady, slides.length]);

  useEffect(() => {
    if (!isReady || typeof window === "undefined") return;
    if (activeIndex >= slides.length) {
      setActiveIndex(0);
      window.sessionStorage.setItem(SLIDE_STORAGE_KEY, "0");
      return;
    }

    window.sessionStorage.setItem(SLIDE_STORAGE_KEY, String(activeIndex));
  }, [activeIndex, isReady, slides.length]);

  const current = slides[activeIndex];
  const [lineOne, lineTwo] = splitHeading(hero.heading);
  const lineTwoParts = String(lineTwo || "").split(/\s+/).filter(Boolean);
  const lastWord = lineTwoParts.pop() || "";
  const leadingWords = lineTwoParts.join(" ");

  return (
    <section className="relative isolate -mt-[5.5rem] min-h-[100svh] overflow-hidden bg-black pt-[5.5rem] text-white">
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${current.url}-${activeIndex}`}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {current.kind === "video" ? (
              <video
                className="h-full w-full object-cover object-center"
                src={current.url}
                poster={current.poster || ""}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
              />
            ) : (
              <img
                src={current.url}
                alt={current.alt || "JATA Ayurveda banner"}
                className="h-full w-full object-cover object-center"
                loading={activeIndex === 0 ? "eager" : "lazy"}
                fetchpriority={activeIndex === 0 ? "high" : "auto"}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.15),transparent_35%),linear-gradient(90deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.38)_45%,rgba(0,0,0,0.25)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/25 to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100svh-5.5rem)] w-full max-w-7xl flex-col px-4 pb-6 pt-0 sm:px-6 lg:px-8">
        <div className="grid flex-1 items-center lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="max-w-3xl">
            <div className="mb-5 inline-flex rounded-full border border-white/18 bg-white/10 px-4 py-2 backdrop-blur-xl">
              <span className="text-xs font-medium uppercase tracking-[0.28em] text-white/90">
                {hero.eyebrow_line1} • {hero.eyebrow_line2}
              </span>
            </div>

            <h1 className="max-w-2xl text-balance font-display text-5xl font-semibold leading-[0.94] tracking-tight text-white sm:text-6xl lg:text-[5.1rem]">
              <span className="block">{lineOne}</span>
              {lineTwo ? (
                <span className="mt-2 block">
                  {leadingWords ? <span>{leadingWords} </span> : null}
                  <span className="italic text-lime-300">{lastWord}</span>
                </span>
              ) : null}
            </h1>

            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-white/88 sm:text-xl">
              {hero.description}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-primary px-7 py-6 text-base font-semibold text-primary-foreground shadow-[0_18px_45px_-18px_rgba(21,94,32,0.7)] hover:bg-primary/90"
              >
                <Link to={hero.primary_cta_href || "/products"}>
                  {hero.primary_cta_label || "Shop Now"}
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/35 bg-white/8 px-7 py-6 text-base font-semibold text-white hover:bg-white/12 hover:text-white"
              >
                <Link to={hero.secondary_cta_href || "/products"}>
                  {hero.secondary_cta_label || "Shop Products"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>

          <div className="hidden lg:block" />
        </div>

        {slides.length > 1 ? (
          <div className="mt-auto flex items-center justify-between gap-4 pt-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length)}
                className="grid h-11 w-11 place-items-center rounded-full border border-white/18 bg-white/10 text-white backdrop-blur-xl transition hover:bg-white/16"
                aria-label="Previous hero slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={
                      index === activeIndex
                        ? "h-2.5 w-8 rounded-full bg-white transition-all"
                        : "h-2.5 w-2.5 rounded-full bg-white/40 transition-all hover:bg-white/60"
                    }
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveIndex((prev) => (prev + 1) % slides.length)}
                className="grid h-11 w-11 place-items-center rounded-full border border-white/18 bg-white/10 text-white backdrop-blur-xl transition hover:bg-white/16"
                aria-label="Next hero slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
