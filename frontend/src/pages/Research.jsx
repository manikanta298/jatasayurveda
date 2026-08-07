import { Section, SectionHeading, Eyebrow } from "@/components/site/Section";
import { useQuery } from "@tanstack/react-query";
import { listResearch } from "@/lib/queries";
import { FALLBACK_RESEARCH } from "@/lib/fallbackContent";
import { FileText, FlaskConical, BookOpen } from "lucide-react";
import researchLabImage from "@/assets/images/research-lab.jpg";

export default function Research() {
  const { data: research = [] } = useQuery({ queryKey: ["research"], queryFn: () => listResearch() });
  const featuredResearch = research.length > 0 ? research : FALLBACK_RESEARCH;

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={researchLabImage} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/92 to-background/55" />
        </div>
        <div className="mx-auto w-full max-w-7xl px-4 pt-16 pb-24 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Eyebrow>Research & Innovation</Eyebrow>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl md:text-6xl">
              Ayurveda that <span className="italic text-primary">measures itself</span>.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-foreground/80">
              We treat classical protocols like any other clinical intervention:
              standardised, tracked, reviewed, and published. Because trust is
              built on evidence, not tradition alone.
            </p>
          </div>
        </div>
      </section>

      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: FlaskConical, title: "In-house pharmacology", body: "Standardised extraction and stability testing on every formulation." },
            { icon: FileText, title: "Outcome tracking", body: "Every patient contributes anonymised data to our long-term registry." },
            { icon: BookOpen, title: "Open protocols", body: "Physician-facing case reports and treatment protocols, freely shared." },
          ].map((c) => (
            <div key={c.title} className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-6 font-display text-xl text-foreground">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Selected studies" title={<>Recent <span className="italic text-primary">work</span>.</>} />
        <div className="mt-10 grid gap-6">
          {featuredResearch.map((r) => (
            <article key={r._id} className="grid gap-4 rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] sm:grid-cols-[100px_1fr] sm:items-start">
              <span className="font-display text-3xl font-semibold text-primary">{r.year}</span>
              <div>
                <h3 className="font-display text-xl text-foreground">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
