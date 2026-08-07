import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Section, Eyebrow } from "@/components/site/Section";
import { SocialLinks } from "@/components/site/SocialLinks";
import { listBlogPosts } from "@/lib/queries";
import { FALLBACK_BLOG_POSTS } from "@/lib/fallbackContent";
import { formatDate } from "@/lib/format";

export default function BlogList() {
  const { data: posts = [] } = useQuery({ queryKey: ["blog"], queryFn: () => listBlogPosts() });
  const featuredPosts = posts.length > 0 ? posts : FALLBACK_BLOG_POSTS;

  return (
    <>
      <Section className="pt-16 pb-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <Eyebrow>Health Journal</Eyebrow>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl md:text-6xl">
              Notes on <span className="italic text-primary">modern Ayurvedic living</span>.
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Follow us</span>
            <SocialLinks />
          </div>
        </div>
      </Section>

      <Section className="pt-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredPosts.map((a) => (
            <Link
              key={a.slug}
              to={`/blog/${a.slug}`}
              className="group overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img src={a.imageUrl} alt={a.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {formatDate(a.publishedAt)} · {a.readingTime}
                </p>
                <h3 className="mt-2 font-display text-xl text-foreground">{a.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{a.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
