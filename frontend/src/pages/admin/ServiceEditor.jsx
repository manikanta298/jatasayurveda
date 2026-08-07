import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { getServiceAdmin, createService, updateService } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { StringListEditor, FaqEditor, StepsEditor, CtaEditor } from "@/components/admin/Editors";
import { SingleImageUploader, MultiImageUploader } from "@/components/admin/MediaUploader";

const empty = {
  name: "",
  slug: "",
  shortDescription: "",
  fullDescription: "",
  bannerImageUrl: "",
  status: "draft",
  isEnabled: true,
  sortOrder: 0,
  symptoms: [],
  causes: [],
  benefits: [],
  treatmentProcess: [],
  faqs: [],
  ctaButtons: [],
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  galleryUrls: [],
};

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export default function ServiceEditor() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: existing, isLoading } = useQuery({
    queryKey: ["admin-service", id],
    queryFn: () => getServiceAdmin(id),
    enabled: !isNew,
  });

  const [f, setF] = useState(empty);

  useEffect(() => {
    if (!existing) return;
    setF({
      id: existing._id,
      name: existing.name,
      slug: existing.slug,
      shortDescription: existing.shortDescription ?? "",
      fullDescription: existing.fullDescription ?? "",
      bannerImageUrl: existing.bannerImageUrl ?? "",
      status: existing.status ?? "draft",
      isEnabled: existing.isEnabled ?? true,
      sortOrder: existing.sortOrder ?? 0,
      symptoms: existing.symptoms ?? [],
      causes: existing.causes ?? [],
      benefits: existing.benefits ?? [],
      treatmentProcess: existing.treatmentProcess ?? [],
      faqs: existing.faqs ?? [],
      ctaButtons: existing.ctaButtons ?? [],
      seoTitle: existing.seoTitle ?? "",
      seoDescription: existing.seoDescription ?? "",
      seoKeywords: existing.seoKeywords ?? "",
      galleryUrls: (existing.images ?? []).map((img) => img.url),
    });
  }, [existing]);

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: f.name,
        slug: f.slug || slugify(f.name),
        shortDescription: f.shortDescription,
        fullDescription: f.fullDescription,
        bannerImageUrl: f.bannerImageUrl,
        status: f.status,
        isEnabled: f.isEnabled,
        sortOrder: f.sortOrder,
        symptoms: f.symptoms,
        causes: f.causes,
        benefits: f.benefits,
        treatmentProcess: f.treatmentProcess.filter((x) => x.title.trim()),
        faqs: f.faqs.filter((x) => x.question.trim() && x.answer.trim()),
        ctaButtons: f.ctaButtons.filter((x) => x.label.trim() && x.href.trim()),
        seoTitle: f.seoTitle,
        seoDescription: f.seoDescription,
        seoKeywords: f.seoKeywords,
        images: f.galleryUrls.map((url, i) => ({ url, alt: "", sortOrder: i })),
      };
      return isNew ? createService(payload) : updateService(f.id, payload);
    },
    onSuccess: (r) => {
      toast.success("Service saved");
      qc.invalidateQueries({ queryKey: ["admin-services"] });
      qc.invalidateQueries({ queryKey: ["admin-service", r._id] });
      if (isNew) navigate(`/admin/services/${r._id}`, { replace: true });
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
            <Link to="/admin/services"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="font-display text-2xl">{isNew ? "New service" : f.name || "Edit service"}</h1>
        </div>
        <Button
          className="rounded-full"
          onClick={() => {
            if (!f.name.trim()) {
              toast.error("Service name is required");
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
          <Card title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value, slug: s.slug || slugify(e.target.value) }))} />
              </Field>
              <Field label="Slug">
                <Input value={f.slug} onChange={(e) => setF((s) => ({ ...s, slug: slugify(e.target.value) }))} />
              </Field>
            </div>
            <Field label="Short description">
              <Textarea value={f.shortDescription} onChange={(e) => setF((s) => ({ ...s, shortDescription: e.target.value }))} rows={2} />
            </Field>
            <Field label="Full description">
              <Textarea value={f.fullDescription} onChange={(e) => setF((s) => ({ ...s, fullDescription: e.target.value }))} rows={6} />
            </Field>
            <Field label="Banner image">
              <SingleImageUploader value={f.bannerImageUrl} onChange={(url) => setF((s) => ({ ...s, bannerImageUrl: url }))} folder="services" />
            </Field>
          </Card>

          <Card title="Condition details">
            <Field label="Symptoms">
              <StringListEditor value={f.symptoms} onChange={(v) => setF((s) => ({ ...s, symptoms: v }))} />
            </Field>
            <Field label="Causes">
              <StringListEditor value={f.causes} onChange={(v) => setF((s) => ({ ...s, causes: v }))} />
            </Field>
            <Field label="Benefits">
              <StringListEditor value={f.benefits} onChange={(v) => setF((s) => ({ ...s, benefits: v }))} />
            </Field>
          </Card>

          <Card title="Treatment process">
            <StepsEditor value={f.treatmentProcess} onChange={(v) => setF((s) => ({ ...s, treatmentProcess: v }))} />
          </Card>

          <Card title="Gallery">
            <MultiImageUploader value={f.galleryUrls} onChange={(v) => setF((s) => ({ ...s, galleryUrls: v }))} folder="services" />
          </Card>

          <Card title="FAQs">
            <FaqEditor value={f.faqs} onChange={(v) => setF((s) => ({ ...s, faqs: v }))} />
          </Card>

          <Card title="CTA buttons">
            <CtaEditor value={f.ctaButtons} onChange={(v) => setF((s) => ({ ...s, ctaButtons: v }))} />
          </Card>

          <Card title="SEO">
            <Field label="SEO title">
              <Input value={f.seoTitle} onChange={(e) => setF((s) => ({ ...s, seoTitle: e.target.value }))} />
            </Field>
            <Field label="SEO description">
              <Textarea value={f.seoDescription} onChange={(e) => setF((s) => ({ ...s, seoDescription: e.target.value }))} rows={2} />
            </Field>
            <Field label="SEO keywords">
              <Input value={f.seoKeywords} onChange={(e) => setF((s) => ({ ...s, seoKeywords: e.target.value }))} />
            </Field>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Visibility">
            <Field label="Status">
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={f.status} onChange={(e) => setF((s) => ({ ...s, status: e.target.value }))}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <div className="flex items-center justify-between pt-2">
              <Label>Enabled on site</Label>
              <Switch checked={f.isEnabled} onCheckedChange={(v) => setF((s) => ({ ...s, isEnabled: v }))} />
            </div>
            <Field label="Sort order">
              <Input type="number" min={0} value={f.sortOrder} onChange={(e) => setF((s) => ({ ...s, sortOrder: parseInt(e.target.value || "0") }))} />
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
