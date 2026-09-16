import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, Eyebrow } from "@/components/site/Section";
import plants from "@/data/data.json";

export default function PlantDetail() {
  const { id } = useParams();
  const plant = plants.find((item) => item.id === id || item.slug === id);

  if (!plant) {
    return (
      <Section className="py-24 text-center">
        <h1 className="font-display text-3xl text-foreground">Plant not found</h1>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/services">Browse Medicinal Plants</Link>
        </Button>
      </Section>
    );
  }

  return (
    <>
      <section className="relative overflow-hidden bg-[var(--gradient-warm)]">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background via-background/90 to-primary/10" />
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.86fr)] lg:px-8 lg:pt-24 lg:pb-28">
          <div className="max-w-2xl">
            <Eyebrow>Medicinal Plant</Eyebrow>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl md:text-6xl">
              {plant.name}
            </h1>
            {plant.description && (
              <p className="mt-5 text-lg leading-relaxed text-foreground/80">{plant.description}</p>
            )}
            <Button asChild size="lg" variant="outline" className="mt-8 rounded-full border-primary/30 bg-background/60 px-7 py-6 text-base text-primary backdrop-blur">
              <Link to="/services"><ArrowLeft className="mr-2 h-4 w-4" /> All Medicinal Plants</Link>
            </Button>
          </div>
          <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-[var(--shadow-elegant)]">
            <img src={plant.image} alt={plant.name} className="aspect-[4/3] w-full object-cover lg:aspect-[4/5]" />
          </div>
        </div>
      </section>

      <Section>
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl text-foreground sm:text-4xl">Details</h2>
          {plant.description ? (
            <div className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted-foreground">{plant.description}</div>
          ) : (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Detailed plant information was not included in the supplied WordPress export.
            </p>
          )}
        </div>
      </Section>
    </>
  );
}
