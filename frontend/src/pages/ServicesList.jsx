import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Section, Eyebrow } from "@/components/site/Section";
import plants from "@/data/data.json";

export default function ServicesList() {
  const featuredServices = plants;

  return (
    <>
      <Section className="pt-16 pb-8">
        <div className="max-w-3xl">
          <Eyebrow>Medicinal Plants</Eyebrow>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl md:text-6xl">
            Treatment programmes <span className="italic text-primary">designed around you</span>.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Every JATAS programme begins with a senior physician, a detailed
            assessment, and a plan that respects your constitution, your
            calendar and your goals.
          </p>
        </div>
      </Section>

      <Section className="pt-4">
        <div className="grid gap-6 md:grid-cols-2">
          {featuredServices.map((s) => (
            <Link
              key={s.id}
              to={`/plant/${s.id}`}
              className="group grid overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)] sm:grid-cols-[1.2fr_1fr]"
            >
              <div className="order-2 flex flex-col p-8 sm:order-1">
                <h3 className="font-display text-2xl text-foreground">{s.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">{s.description || ""}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-medium text-primary">
                  Explore programme <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
              <div className="order-1 aspect-square overflow-hidden sm:order-2 sm:aspect-auto">
                {s.image ? (
                  <img src={s.image} alt={s.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div aria-hidden="true" className="h-full w-full bg-muted" />
                )}
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
