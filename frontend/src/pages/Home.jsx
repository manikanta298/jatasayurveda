import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, Sparkles, Leaf, ShieldCheck, FlaskConical, HeartPulse, Star, Award, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeading, Eyebrow } from "@/components/site/Section";
import { HeroSection } from "@/components/site/HeroSection";
import { CardCarousel } from "@/components/site/CardCarousel";
import { listProducts, listDoctors, listTestimonials, listBlogPosts, listCertifications } from "@/lib/queries";
import { useCart } from "@/lib/cart";
import { formatINRFromPaise, formatDate } from "@/lib/format";
import researchLabImage from "@/assets/images/research-lab.jpg";
import {
  FALLBACK_PRODUCTS,
  FALLBACK_TESTIMONIALS,
  FALLBACK_BLOG_POSTS,
  FALLBACK_CERTIFICATIONS,
  FALLBACK_DOCTORS,
} from "@/lib/fallbackContent";

export default function Home() {
  const navigate = useNavigate();
  const { add } = useCart();
  // sort: "-updatedAt" — homepage always reflects whatever was most recently
  // edited in the admin panel, not a manually curated sortOrder. Fetching
  // exactly 3 directly from the backend (rather than fetching everything and
  // slicing client-side) keeps this correct even as the catalog grows.
  const { data: products = [] } = useQuery({ queryKey: ["products", "recent"], queryFn: () => listProducts({ sort: "-updatedAt", limit: 3 }) });
  const { data: doctors = [] } = useQuery({ queryKey: ["doctors"], queryFn: () => listDoctors() });
  const { data: testimonials = [] } = useQuery({ queryKey: ["testimonials"], queryFn: () => listTestimonials() });
  const { data: articles = [] } = useQuery({ queryKey: ["blog", "recent"], queryFn: () => listBlogPosts({ sort: "-updatedAt", limit: 3 }) });
  const { data: certifications = [] } = useQuery({ queryKey: ["certifications"], queryFn: () => listCertifications() });

  const featuredProducts = (products.length > 0 ? products : FALLBACK_PRODUCTS).slice(0, 3);
  const featuredArticles = (articles.length > 0 ? articles : FALLBACK_BLOG_POSTS).slice(0, 3);
  const featuredTestimonials = testimonials.length > 0 ? testimonials : FALLBACK_TESTIMONIALS;
  const featuredDoctors = doctors.length > 0 ? doctors : FALLBACK_DOCTORS;
  const featuredCertifications = certifications.length > 0 ? certifications : FALLBACK_CERTIFICATIONS;

  return (
    <>
      <HeroSection />

      {/* WHY CHOOSE */}
      <Section>
        <SectionHeading
          eyebrow="Why JATAS Ayurveda"
          title={<>Ancient wisdom, <span className="text-primary italic">honestly delivered.</span></>}
          description="We don't sell shortcuts. We build long-term wellness with senior physicians, transparent formulations and protocols that respect both classical shastra and modern evidence."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: HeartPulse, title: "Physician-led care", body: "Every treatment begins with a senior Vaidya — never a sales conversation." },
            { icon: FlaskConical, title: "Research-backed", body: "Our formulations are standardised and studied for reproducible outcomes." },
            { icon: Leaf, title: "Authentically sourced", body: "Wild-harvested and organic-grown herbs traced to their farms of origin." },
            { icon: ShieldCheck, title: "GMP & AYUSH certified", body: "Manufactured under strict pharmaceutical-grade quality controls." },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-6 font-display text-xl text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* FEATURED PRODUCTS */}
      {featuredProducts.length > 0 && (
        <Section>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Featured Products"
              title={<>Pharmacy-grade Ayurveda, <span className="italic text-primary">shipped to your door.</span></>}
              description="Small-batch, standardised and traceable. Every jar leaves our GMP-certified pharmacy with a physician-approved formulation card."
            />
            <Button asChild variant="ghost" className="rounded-full text-primary hover:bg-primary/5">
              <Link to="/products">Shop all <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          <CardCarousel
            items={featuredProducts}
            keyFn={(p) => p.slug}
            renderItem={(p) => {
              const hasDiscount = p.discountPricePaise != null && p.discountPricePaise < p.pricePaise;
              const displayPrice = hasDiscount ? p.discountPricePaise : p.pricePaise;
              const discountPercent = hasDiscount
                ? Math.round(((p.pricePaise - p.discountPricePaise) / p.pricePaise) * 100)
                : 0;
              return (
                <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
                  <Link to={`/products/${p.slug}`} className="block">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <img src={p.featuredImageUrl} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      {hasDiscount && (
                        <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                          {discountPercent}% off
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col p-6">
                    <Link to={`/products/${p.slug}`} className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-gold-foreground/70">{p.categoryLabel}</p>
                      <h3 className="mt-1 truncate font-display text-xl text-foreground">{p.name}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.shortDescription}</p>
                    </Link>
                    <div className="mt-3 flex items-baseline gap-2">
                      <p className="font-display text-xl font-semibold text-primary">{formatINRFromPaise(displayPrice)}</p>
                      {hasDiscount && (
                        <p className="text-sm text-muted-foreground line-through">{formatINRFromPaise(p.pricePaise)}</p>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          add(p, 1);
                          toast.success(`${p.name} added to cart`);
                        }}
                        className="flex-1 rounded-full border-primary/30 text-primary hover:bg-primary/5"
                      >
                        <ShoppingBag className="mr-1.5 h-3.5 w-3.5" /> Add to cart
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          add(p, 1);
                          navigate("/checkout");
                        }}
                        className="flex-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Buy now
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </Section>
      )}

      {/* DOCTORS */}
      {featuredDoctors.length > 0 && (
        <Section>
          <SectionHeading
            eyebrow="Meet Our Vaidyas"
            title={<>Physicians who <span className="italic text-primary">listen.</span></>}
            description="Our senior Vaidyas bring decades of clinical experience across Panchakarma, chronic disease reversal and women's health."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {featuredDoctors.map((d) => (
              <div key={d._id} className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 font-display text-xl text-primary">
                  {d.name.split(" ")[1]?.charAt(0) ?? "V"}
                </div>
                <h3 className="mt-5 font-display text-lg text-foreground">{d.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-wider text-gold-foreground/80">{d.role}</p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{d.bio}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      

      {/* TESTIMONIALS */}
      {featuredTestimonials.length > 0 && (
        <Section>
          <SectionHeading
            eyebrow="Patient Stories"
            title={<>Real people. <span className="italic text-primary">Real transformations.</span></>}
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {featuredTestimonials.map((t) => (
              <figure key={t._id} className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
                <div className="flex gap-1 text-gold">
                  {Array.from({ length: t.rating || 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-5 font-display text-xl leading-snug text-foreground">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 text-sm">
                  <p className="font-medium text-foreground">{t.name}</p>
                  <p className="text-muted-foreground">{t.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>
      )}

      {/* ARTICLES */}
      {featuredArticles.length > 0 && (
        <Section>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Health Journal"
              title={<>Reading for the <span className="italic text-primary">curious.</span></>}
            />
            <Button asChild variant="ghost" className="rounded-full text-primary hover:bg-primary/5">
              <Link to="/blog">All articles <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <CardCarousel
            items={featuredArticles}
            keyFn={(a) => a.slug}
            renderItem={(a) => (
              <Link
                to={`/blog/${a.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={a.imageUrl} alt={a.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="p-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {formatDate(a.publishedAt)} · {a.readingTime}
                  </p>
                  <h3 className="mt-2 font-display text-xl text-foreground">{a.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
                </div>
              </Link>
            )}
          />
        </Section>
      )}

      {/* CERTIFICATIONS */}
      {featuredCertifications.length > 0 && (
        <Section>
          <div className="rounded-[2rem] border border-border bg-[var(--gradient-warm)] p-10 sm:p-14">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-md">
                <Eyebrow>Certifications & Awards</Eyebrow>
                <h3 className="mt-4 font-display text-2xl text-foreground sm:text-3xl">Trusted, certified, quality-controlled.</h3>
              </div>
              <Award className="h-14 w-14 text-gold" />
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {featuredCertifications.map((c) => (
                <div key={c._id} className="rounded-2xl border border-border bg-background/60 px-4 py-6 text-center text-sm font-medium text-foreground">
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* CONTACT CTA */}
      <Section>
        <div className="grid items-center gap-8 rounded-[2rem] border border-border bg-card p-10 shadow-[var(--shadow-soft)] sm:p-14 lg:grid-cols-2">
          <div>
            <Eyebrow>Ready to begin?</Eyebrow>
            <h3 className="mt-4 font-display text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
              Book a consultation with a senior Vaidya.
            </h3>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              Tell us what you're navigating. We'll match you with the right physician and
              design a protocol that respects your life and your goals.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
            <Button asChild size="lg" className="rounded-full bg-primary px-7 py-6 text-base text-primary-foreground shadow-[var(--shadow-elegant)] hover:bg-primary/90">
              <Link to="/consultation">Book Consultation</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
