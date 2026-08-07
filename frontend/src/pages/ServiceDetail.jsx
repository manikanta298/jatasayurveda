import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Section, Eyebrow } from "@/components/site/Section";
import { getService } from "@/lib/queries";
import { FALLBACK_SERVICES } from "@/lib/fallbackContent";
import { formatINRFromPaise } from "@/lib/format";

export default function ServiceDetail() {
  const { slug } = useParams();
  const { data: service, isLoading, isError, error } = useQuery({
    queryKey: ["service", slug],
    queryFn: () => getService(slug),
  });

  if (isLoading) {
    return (
      <Section className="py-24 text-center">
        <h1 className="font-display text-3xl text-foreground">Loading Medicinal Plants…</h1>
        <p className="mt-2 text-muted-foreground">Please wait while we load the treatment programme.</p>
      </Section>
    );
  }

  if (isError || !service) {
    return (
      <Section className="py-24 text-center">
        <h1 className="font-display text-3xl text-foreground">
          {isError ? "Something went wrong" : "Service not found"}
        </h1>
        {isError ? (
          <p className="mt-2 text-muted-foreground">{error?.message}</p>
        ) : (
          <Button asChild className="mt-6 rounded-full">
            <Link to="/services">Browse all services</Link>
          </Button>
        )}
      </Section>
    );
  }

  const related = service.relatedProducts || [];
  const bannerImage = service.bannerImageUrl || FALLBACK_SERVICES[0]?.bannerImageUrl;

  return (
    <>
      <section className="relative overflow-hidden bg-[var(--gradient-warm)]">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background via-background/90 to-primary/10" />
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.86fr)] lg:px-8 lg:pt-24 lg:pb-28">
          <div className="max-w-2xl">
            <Eyebrow>Treatment programme</Eyebrow>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl md:text-6xl">
              {service.name}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-foreground/80">{service.shortDescription}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-primary px-7 py-6 text-base text-primary-foreground shadow-[var(--shadow-elegant)] hover:bg-primary/90">
                <Link to="/contact">Book Consultation <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-primary/30 bg-background/60 px-7 py-6 text-base text-primary backdrop-blur">
                <Link to="/services">All Medicinal Plants</Link>
              </Button>
            </div>
          </div>
          {bannerImage && (
            <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-[var(--shadow-elegant)]">
              <img src={bannerImage} alt={service.name} className="aspect-[4/3] w-full object-cover lg:aspect-[4/5]" />
            </div>
          )}
        </div>
      </section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="font-display text-3xl text-foreground sm:text-4xl">Overview</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">{service.fullDescription}</p>
          </div>
          <div className="space-y-6">
            <aside className="rounded-3xl border border-border bg-[var(--gradient-warm)] p-8">
              <h3 className="font-display text-xl text-foreground">At a glance</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Senior physician-led</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Personalised protocol</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Residential or outpatient options</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Home care plan included</li>
              </ul>
            </aside>
          </div>
        </div>
      </Section>

      {service.images?.length > 0 && (
        <Section className="pt-4">
          <h2 className="font-display text-3xl text-foreground sm:text-4xl">Gallery</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {service.images.map((img, i) => (
              <div key={`${img.url}-${i}`} className="overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-soft)]">
                <img
                  src={img.url}
                  alt={img.alt || service.name}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </Section>
      )}

      {(service.symptoms?.length > 0 || service.causes?.length > 0) && (
        <Section className="pt-4">
          <div className="grid gap-6 md:grid-cols-2">
            {service.symptoms?.length > 0 && (
              <div className="rounded-3xl border border-border bg-card p-10 shadow-[var(--shadow-soft)]">
                <h3 className="font-display text-2xl text-foreground">Symptoms we treat</h3>
                <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                  {service.symptoms.map((s) => (
                    <li key={s} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {service.causes?.length > 0 && (
              <div className="rounded-3xl border border-border bg-card p-10 shadow-[var(--shadow-soft)]">
                <h3 className="font-display text-2xl text-foreground">Root causes we address</h3>
                <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                  {service.causes.map((s) => (
                    <li key={s} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {service.treatmentProcess?.length > 0 && (
        <Section>
          <h2 className="font-display text-3xl text-foreground sm:text-4xl">The programme, step by step</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-2">
            {service.treatmentProcess.map((p, i) => (
              <li key={p.title} className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
                <span className="font-display text-4xl font-semibold text-primary/30">0{i + 1}</span>
                <h3 className="mt-2 font-display text-xl text-foreground">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {service.benefits?.length > 0 && (
        <Section>
          <div className="rounded-[2rem] bg-[var(--gradient-primary)] p-10 text-black shadow-[var(--shadow-elegant)] sm:p-14">
            <h2 className="font-display text-3xl text-black sm:text-4xl">What patients experience</h2>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {service.benefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-black/90">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-gold" /> {b}
                </li>
              ))}
            </ul>
          </div>
        </Section>
      )}

      {service.faqs?.length > 0 && (
        <Section>
          <h2 className="font-display text-3xl text-foreground sm:text-4xl">Frequently asked</h2>
          <Accordion type="single" collapsible className="mt-8">
            {service.faqs.map((f, i) => (
              <AccordionItem key={i} value={String(i)}>
                <AccordionTrigger className="text-left font-display text-lg text-foreground">{f.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Section>
      )}

      {related.length > 0 && (
        <Section>
          <h2 className="font-display text-3xl text-foreground sm:text-4xl">Recommended products</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <Link
                key={p.slug}
                to={`/products/${p.slug}`}
                className="group overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  <img src={p.featuredImageUrl} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="flex items-start justify-between gap-4 p-6">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-lg text-foreground">{p.name}</h3>
                  </div>
                  <p className="shrink-0 font-display text-lg font-semibold text-primary">
                    {formatINRFromPaise(p.discountPricePaise ?? p.pricePaise)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section>
        <div className="rounded-[2rem] border border-border bg-card p-10 text-center shadow-[var(--shadow-soft)] sm:p-14">
          <h3 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
            Speak with a senior Vaidya today.
          </h3>
          <p className="mt-3 text-muted-foreground">Free 15-minute discovery call to see if this programme is right for you.</p>
          <Button asChild size="lg" className="mt-8 rounded-full bg-primary px-7 py-6 text-base text-primary-foreground shadow-[var(--shadow-elegant)] hover:bg-primary/90">
            <Link to="/contact">Book Consultation</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
