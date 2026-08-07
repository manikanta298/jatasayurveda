import { useQuery } from "@tanstack/react-query";
import { Section, SectionHeading, Eyebrow } from "@/components/site/Section";
import { AboutIntroSection } from "@/components/site/AboutIntroSection";
import { listCertifications } from "@/lib/queries";
import { FALLBACK_CERTIFICATIONS } from "@/lib/fallbackContent";
import { Leaf, Compass, Sparkles, Heart, Check, FlaskConical, Sprout, Globe2 } from "lucide-react";

// Sourced from the client-provided "About Us" document (Jatas Ayurvedic
// Healthcare Systems LLP). Update here — or via Admin > Settings > About —
// if the company's history, leadership, or offerings change.

const journey = [
  { year: "2000", title: "The foundation", body: "Laid through medicinal plant nurseries, cultivation, and Ayurvedic research." },
  { year: "25 Aug 2022", title: "Re-established", body: "Re-established as Jatas Ayurvedic Healthcare Systems LLP, based in Kakinada, Andhra Pradesh." },
  { year: "Today", title: "Innovation & growth", body: "Focused on innovation, technology, and global opportunities across the AYUSH ecosystem." },
];

const whatWeDo = [
  "Ayurvedic Research & Product Development",
  "Ayurvedic Healthcare & Wellness",
  "Medicinal Plant Cultivation & Conservation",
  "Seed-to-Shelf Solutions for the AYUSH Industry",
  "Industry Collaborations and Technology Transfer",
];

const mission = [
  "Promote authentic Ayurveda through research and innovation.",
  "Develop safe, effective, and scientifically validated herbal products.",
  "Support sustainable cultivation and conservation of medicinal plants.",
  "Empower farmers and communities.",
  "Deliver quality raw materials and finished products.",
  "Build a complete Seed-to-Shelf ecosystem.",
  "Expand holistic wellness through education, research, and healthcare services.",
];

const whyChoose = [
  { icon: Sprout, title: "Two decades of knowledge", body: "Over two decades of Ayurvedic knowledge and experience." },
  { icon: FlaskConical, title: "Strong research foundation", body: "Formulations grounded in rigorous research, not tradition alone." },
  { icon: Sparkles, title: "Quality & authenticity", body: "Quality, authenticity, and innovation at every stage." },
  { icon: Leaf, title: "Seed to shelf expertise", body: "Expertise spanning medicinal plants to finished products." },
  { icon: Heart, title: "Experienced leadership", body: "Guided by experienced leadership and renowned scientific advisors." },
  { icon: Compass, title: "Sustainable healthcare", body: "A firm commitment to sustainable healthcare practices." },
  { icon: Globe2, title: "Global growth vision", body: "Built with a vision for global reach and impact." },
];

const leadership = [
  { name: "Mr. Ponnapalli Madhav Prabhas", role: "Designated Partner" },
  { name: "Mr. Veera Venkata Narayana Chekuri", role: "Partner" },
  { name: "Mrs. Jatavallabhula Vijaya Ramalakshmi", role: "Founding Partner" },
  { name: "Dr. J. L. N. Sastry", role: "Scientific Advisor & Brand Ambassador" },
  { name: "Dr. Purighalla Satya Srinivasan", role: "Partner" },
];

const innovations = ["MOTANYL™", "MOTANYL-O™", "COGNIKING™"];

export default function About() {
  const { data: certifications = [] } = useQuery({ queryKey: ["certifications"], queryFn: () => listCertifications() });
  const featuredCertifications = certifications.length > 0 ? certifications : FALLBACK_CERTIFICATIONS;

  return (
    <>
      <AboutIntroSection />

      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-10 shadow-[var(--shadow-soft)]">
            <Eyebrow>Vision</Eyebrow>
            <h2 className="mt-4 font-display text-3xl text-foreground">
              To become a globally respected Ayurvedic healthcare organization that combines
              traditional wisdom with scientific innovation.
            </h2>
          </div>
          <div className="rounded-3xl border border-border bg-[var(--gradient-warm)] p-10 shadow-[var(--shadow-soft)]">
            <Eyebrow>Mission</Eyebrow>
            <ul className="mt-5 space-y-2.5 text-sm leading-relaxed text-foreground/85">
              {mission.map((m) => (
                <li key={m} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="What we do" title={<>A complete <span className="italic text-primary">Seed-to-Shelf</span> ecosystem.</>} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {whatWeDo.map((w) => (
            <div key={w} className="rounded-3xl border border-border bg-card p-6 text-sm font-medium leading-snug text-foreground shadow-[var(--shadow-soft)]">
              {w}
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Why choose Jatas?" title={<>What we <span className="italic text-primary">believe in</span>.</>} />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {whyChoose.map((v) => (
            <div key={v.title} className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-6 font-display text-xl text-foreground">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Our journey"
          title={<>Over two decades of <span className="italic text-primary">Ayurvedic heritage</span>.</>}
          description="The journey of Jatas began over two decades ago with a vision to preserve the rich heritage of Ayurveda while making it relevant for modern healthcare."
        />
        <ol className="mt-14 space-y-6">
          {journey.map((t) => (
            <li key={t.year} className="grid gap-4 rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] sm:grid-cols-[160px_1fr] sm:items-baseline">
              <span className="font-display text-2xl font-semibold text-primary sm:text-3xl">{t.year}</span>
              <div>
                <h3 className="font-display text-xl text-foreground">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <SectionHeading eyebrow="Leadership" title={<>The people behind <span className="italic text-primary">Jatas</span>.</>} />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {leadership.map((d) => (
            <div key={d.name} className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 font-display text-xl text-primary">
                {d.name.replace(/^(Mr\.|Mrs\.|Dr\.)\s*/, "").charAt(0)}
              </div>
              <h3 className="mt-5 font-display text-lg text-foreground">{d.name}</h3>
              <p className="mt-1 text-xs uppercase tracking-wider text-gold-foreground/80">{d.role}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Innovations" title={<>Formulations we're <span className="italic text-primary">proud of</span>.</>} />
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {innovations.map((name) => (
            <div key={name} className="rounded-3xl border border-border bg-[var(--gradient-warm)] px-6 py-10 text-center shadow-[var(--shadow-soft)]">
              <span className="font-display text-2xl font-semibold text-primary">{name}</span>
            </div>
          ))}
        </div>
      </Section>

      {featuredCertifications.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Certifications" title={<>Independently <span className="italic text-primary">verified</span>.</>} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {featuredCertifications.map((c) => (
              <div key={c._id} className="rounded-2xl border border-border bg-card px-4 py-6 text-center text-sm font-medium text-foreground shadow-[var(--shadow-soft)]">
                {c.label}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section>
        <div className="rounded-[2rem] bg-[var(--gradient-primary)] p-10 text-center text-black shadow-[var(--shadow-elegant)] sm:p-14">
          <Eyebrow>Our promise</Eyebrow>
          <h3 className="mx-auto mt-4 max-w-2xl font-display text-2xl text-black sm:text-3xl">
            At Jatas, Ayurveda is more than a system of medicine — it is a way of creating
            healthier lives through nature, knowledge, and innovation.
          </h3>
        </div>
      </Section>
    </>
  );
}
