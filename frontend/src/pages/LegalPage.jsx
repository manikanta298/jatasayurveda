import { Link, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Section } from "@/components/site/Section";
import { LEGAL_PAGES } from "@/lib/legalContent";

export default function LegalPage({ slug: slugProp }) {
  const params = useParams();
  const slug = slugProp || params.slug;
  const page = LEGAL_PAGES[slug];

  if (!page) {
    return (
      <Section className="py-24 text-center">
        <h1 className="font-display text-3xl text-foreground">Page not found</h1>
        <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to home
        </Link>
      </Section>
    );
  }

  return (
    <Section className="pt-12 pb-24">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{page.title}</span>
      </nav>

      <h1 className="mt-4 font-display text-3xl font-semibold text-foreground sm:text-4xl">{page.title}</h1>

      <div className="mx-auto mt-10 max-w-3xl space-y-10">
        {page.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-xl text-foreground">{section.heading}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {section.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {section.bullets && (
                <ul className="list-disc space-y-1.5 pl-5">
                  {section.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>
    </Section>
  );
}
