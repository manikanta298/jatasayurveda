import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Play } from "lucide-react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Section, Eyebrow } from "@/components/site/Section";
import { SocialLinks } from "@/components/site/SocialLinks";
import { getBlogPost } from "@/lib/queries";
import { formatDate } from "@/lib/format";

export default function BlogDetail() {
  const { slug } = useParams();
  const [playing, setPlaying] = useState(false);
  const { data: article, isLoading, isError, error } = useQuery({
    queryKey: ["blog", slug],
    queryFn: () => getBlogPost(slug),
  });

  if (isLoading) {
    return (
      <Section className="py-24 text-center">
        <h1 className="font-display text-3xl text-foreground">Loading article…</h1>
        <p className="mt-2 text-muted-foreground">Please wait while we load the journal post.</p>
      </Section>
    );
  }

  if (isError || !article) {
    return (
      <Section className="py-24 text-center">
        <h1 className="font-display text-3xl text-foreground">
          {isError ? "Something went wrong" : "Article not found"}
        </h1>
        {isError ? (
          <p className="mt-2 text-muted-foreground">{error?.message}</p>
        ) : (
          <Button asChild className="mt-6 rounded-full">
            <Link to="/blog">Back to journal</Link>
          </Button>
        )}
      </Section>
    );
  }

  const hasPostSocials = article.socialLinks && Object.values(article.socialLinks).some(Boolean);

  return (
    <article>
      <Section className="pt-12 pb-4">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to journal
        </Link>
        <div className="mx-auto mt-8 max-w-3xl">
          <Eyebrow>
            {formatDate(article.publishedAt)} · {article.readingTime}
          </Eyebrow>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-foreground text-balance sm:text-5xl">
            {article.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>
          <div className="mt-6 flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Share</span>
            <SocialLinks links={hasPostSocials ? article.socialLinks : undefined} />
          </div>
        </div>
      </Section>

      <Section className="pt-4">
        {article.videoUrl ? (
          <div className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-border shadow-[var(--shadow-soft)]">
            {playing ? (
              <video
                src={article.videoUrl}
                controls
                autoPlay
                className="aspect-[16/9] w-full bg-black object-cover"
              />
            ) : (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                aria-label="Play video"
                className="group relative block aspect-[16/9] w-full"
              >
                {article.imageUrl && (
                  <img src={article.imageUrl} alt={article.title} className="h-full w-full object-cover" />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/35">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-primary shadow-[var(--shadow-elegant)] transition-transform group-hover:scale-110">
                    <Play className="ml-1 h-6 w-6 fill-current" />
                  </span>
                </span>
              </button>
            )}
          </div>
        ) : (
          article.imageUrl && (
            <div className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-border shadow-[var(--shadow-soft)]">
              <img src={article.imageUrl} alt={article.title} className="aspect-[16/9] w-full object-cover" />
            </div>
          )
        )}

        {article.content ? (
          <div
            className="mx-auto mt-12 max-w-3xl space-y-6 text-base leading-relaxed text-foreground/85 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(article.content, { USE_PROFILES: { html: true } }),
            }}
          />
        ) : (
          <p className="mx-auto mt-12 max-w-3xl text-base text-muted-foreground">
            Full article content coming soon.
          </p>
        )}
      </Section>
    </article>
  );
}
