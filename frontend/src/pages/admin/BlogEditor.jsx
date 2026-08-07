import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { getBlogAdmin, createBlogPost, updateBlogPost } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StringListEditor } from "@/components/admin/Editors";
import { SingleImageUploader, SingleVideoUploader } from "@/components/admin/MediaUploader";

const emptySocialLinks = { instagram: "", facebook: "", youtube: "", twitter: "", linkedin: "" };

const empty = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  imageUrl: "",
  videoUrl: "",
  author: "",
  readingTime: "",
  tags: [],
  seoTitle: "",
  seoDescription: "",
  status: "draft",
  publishedAt: "",
  socialLinks: emptySocialLinks,
};

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export default function BlogEditor() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: existing, isLoading } = useQuery({
    queryKey: ["admin-blog-post", id],
    queryFn: () => getBlogAdmin(id),
    enabled: !isNew,
  });

  const [f, setF] = useState(empty);

  useEffect(() => {
    if (!existing) return;
    setF({
      id: existing._id,
      title: existing.title,
      slug: existing.slug,
      excerpt: existing.excerpt ?? "",
      content: existing.content ?? "",
      imageUrl: existing.imageUrl ?? "",
      videoUrl: existing.videoUrl ?? "",
      author: existing.author ?? "",
      readingTime: existing.readingTime ?? "",
      tags: existing.tags ?? [],
      seoTitle: existing.seoTitle ?? "",
      seoDescription: existing.seoDescription ?? "",
      status: existing.status ?? "draft",
      publishedAt: existing.publishedAt ? existing.publishedAt.slice(0, 10) : "",
      socialLinks: { ...emptySocialLinks, ...(existing.socialLinks || {}) },
    });
  }, [existing]);

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        title: f.title,
        slug: f.slug || slugify(f.title),
        excerpt: f.excerpt,
        content: f.content,
        imageUrl: f.imageUrl,
        videoUrl: f.videoUrl,
        author: f.author,
        readingTime: f.readingTime,
        tags: f.tags,
        seoTitle: f.seoTitle,
        seoDescription: f.seoDescription,
        status: f.status,
        socialLinks: f.socialLinks,
        ...(f.publishedAt ? { publishedAt: f.publishedAt } : {}),
      };
      return isNew ? createBlogPost(payload) : updateBlogPost(f.id, payload);
    },
    onSuccess: (r) => {
      toast.success("Post saved");
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
      qc.invalidateQueries({ queryKey: ["admin-blog-post", r._id] });
      if (isNew) navigate(`/admin/blog/${r._id}`, { replace: true });
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isNew && isLoading) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to="/admin/blog"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="font-display text-2xl">{isNew ? "New post" : f.title || "Edit post"}</h1>
        </div>
        <Button
          className="rounded-full"
          onClick={() => {
            if (!f.title.trim()) {
              toast.error("Title is required");
              return;
            }
            mut.mutate();
          }}
          disabled={mut.isPending}
        >
          <Save className="h-4 w-4" /> {mut.isPending ? "Saving…" : "Save"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Content">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title">
                <Input value={f.title} onChange={(e) => setF((s) => ({ ...s, title: e.target.value, slug: s.slug || slugify(e.target.value) }))} />
              </Field>
              <Field label="Slug">
                <Input value={f.slug} onChange={(e) => setF((s) => ({ ...s, slug: slugify(e.target.value) }))} />
              </Field>
            </div>
            <Field label="Excerpt">
              <Textarea value={f.excerpt} onChange={(e) => setF((s) => ({ ...s, excerpt: e.target.value }))} rows={2} />
            </Field>
            <Field label="Content (HTML)">
              <Textarea value={f.content} onChange={(e) => setF((s) => ({ ...s, content: e.target.value }))} rows={12} className="font-mono text-xs" />
            </Field>
            <Field label="Cover image">
              <SingleImageUploader value={f.imageUrl} onChange={(url) => setF((s) => ({ ...s, imageUrl: url }))} folder="blog" />
            </Field>
            <Field label="Video (optional)">
              <p className="text-xs text-muted-foreground">
                If set, the cover image becomes clickable on the article page and plays this video.
              </p>
              <SingleVideoUploader value={f.videoUrl} onChange={(url) => setF((s) => ({ ...s, videoUrl: url }))} folder="blog" />
            </Field>
          </Card>

          <Card title="SEO">
            <Field label="SEO title">
              <Input value={f.seoTitle} onChange={(e) => setF((s) => ({ ...s, seoTitle: e.target.value }))} />
            </Field>
            <Field label="SEO description">
              <Textarea value={f.seoDescription} onChange={(e) => setF((s) => ({ ...s, seoDescription: e.target.value }))} rows={2} />
            </Field>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Details">
            <Field label="Author">
              <Input value={f.author} onChange={(e) => setF((s) => ({ ...s, author: e.target.value }))} />
            </Field>
            <Field label="Reading time">
              <Input value={f.readingTime} onChange={(e) => setF((s) => ({ ...s, readingTime: e.target.value }))} placeholder="e.g. 5 min read" />
            </Field>
            <Field label="Published date">
              <Input type="date" value={f.publishedAt} onChange={(e) => setF((s) => ({ ...s, publishedAt: e.target.value }))} />
            </Field>
            <Field label="Tags">
              <StringListEditor value={f.tags} onChange={(v) => setF((s) => ({ ...s, tags: v }))} />
            </Field>
          </Card>

          <Card title="Visibility">
            <Field label="Status">
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={f.status} onChange={(e) => setF((s) => ({ ...s, status: e.target.value }))}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </Field>
          </Card>

          <Card title="Social media links">
            <p className="text-xs text-muted-foreground">
              Optional — link this post to a related YouTube video, Instagram post, etc.
              Shown on the article page alongside the "Share" icons.
            </p>
            <Field label="YouTube">
              <Input
                value={f.socialLinks.youtube}
                onChange={(e) => setF((s) => ({ ...s, socialLinks: { ...s.socialLinks, youtube: e.target.value } }))}
                placeholder="https://youtube.com/watch?v=…"
              />
            </Field>
            <Field label="Instagram">
              <Input
                value={f.socialLinks.instagram}
                onChange={(e) => setF((s) => ({ ...s, socialLinks: { ...s.socialLinks, instagram: e.target.value } }))}
                placeholder="https://instagram.com/…"
              />
            </Field>
            <Field label="Facebook">
              <Input
                value={f.socialLinks.facebook}
                onChange={(e) => setF((s) => ({ ...s, socialLinks: { ...s.socialLinks, facebook: e.target.value } }))}
                placeholder="https://facebook.com/…"
              />
            </Field>
            <Field label="Twitter / X">
              <Input
                value={f.socialLinks.twitter}
                onChange={(e) => setF((s) => ({ ...s, socialLinks: { ...s.socialLinks, twitter: e.target.value } }))}
                placeholder="https://x.com/…"
              />
            </Field>
            <Field label="LinkedIn">
              <Input
                value={f.socialLinks.linkedin}
                onChange={(e) => setF((s) => ({ ...s, socialLinks: { ...s.socialLinks, linkedin: e.target.value } }))}
                placeholder="https://linkedin.com/…"
              />
            </Field>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-lg">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
