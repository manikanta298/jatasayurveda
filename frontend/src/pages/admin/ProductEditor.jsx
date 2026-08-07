import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { getProductAdmin, createProduct, updateProduct, listCategoriesAdmin } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { StringListEditor, FaqEditor } from "@/components/admin/Editors";
import { SingleImageUploader, MultiImageUploader } from "@/components/admin/MediaUploader";

const empty = {
  name: "",
  slug: "",
  category: null,
  categoryLabel: "",
  shortDescription: "",
  fullDescription: "",
  priceRupees: "0",
  discountPriceRupees: "",
  sku: "",
  stockQuantity: 0,
  status: "draft",
  isEnabled: true,
  sortOrder: 0,
  featuredImageUrl: "",
  ingredients: [],
  benefits: [],
  tags: [],
  dosage: "",
  usageInstructions: "",
  precautions: "",
  faqs: [],
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  galleryUrls: [],
};

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export default function ProductEditor() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: cats = [] } = useQuery({ queryKey: ["admin-categories"], queryFn: () => listCategoriesAdmin({ limit: 200 }) });

  const { data: existing, isLoading } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => getProductAdmin(id),
    enabled: !isNew,
  });

  const [f, setF] = useState(empty);

  useEffect(() => {
    if (!existing) return;
    setF({
      id: existing._id,
      name: existing.name,
      slug: existing.slug,
      category: existing.category?._id ?? null,
      categoryLabel: existing.categoryLabel ?? "",
      shortDescription: existing.shortDescription ?? "",
      fullDescription: existing.fullDescription ?? "",
      priceRupees: String((existing.pricePaise ?? 0) / 100),
      discountPriceRupees: existing.discountPricePaise != null ? String(existing.discountPricePaise / 100) : "",
      sku: existing.sku ?? "",
      stockQuantity: existing.stockQuantity ?? 0,
      status: existing.status ?? "draft",
      isEnabled: existing.isEnabled ?? true,
      sortOrder: existing.sortOrder ?? 0,
      featuredImageUrl: existing.featuredImageUrl ?? "",
      ingredients: existing.ingredients ?? [],
      benefits: existing.benefits ?? [],
      tags: existing.tags ?? [],
      dosage: existing.dosage ?? "",
      usageInstructions: existing.usageInstructions ?? "",
      precautions: existing.precautions ?? "",
      faqs: existing.faqs ?? [],
      seoTitle: existing.seoTitle ?? "",
      seoDescription: existing.seoDescription ?? "",
      seoKeywords: existing.seoKeywords ?? "",
      galleryUrls: (existing.images ?? []).map((img) => img.url),
    });
  }, [existing]);

  const mut = useMutation({
    mutationFn: async () => {
      const pricePaise = Math.round(parseFloat(f.priceRupees || "0") * 100);
      const discountPricePaise = f.discountPriceRupees.trim() ? Math.round(parseFloat(f.discountPriceRupees) * 100) : null;
      const payload = {
        name: f.name,
        slug: f.slug || slugify(f.name),
        category: f.category || null,
        categoryLabel: f.categoryLabel || "",
        shortDescription: f.shortDescription,
        fullDescription: f.fullDescription,
        pricePaise,
        discountPricePaise,
        sku: f.sku,
        stockQuantity: f.stockQuantity,
        status: f.status,
        isEnabled: f.isEnabled,
        sortOrder: f.sortOrder,
        featuredImageUrl: f.featuredImageUrl,
        ingredients: f.ingredients,
        benefits: f.benefits,
        tags: f.tags,
        dosage: f.dosage,
        usageInstructions: f.usageInstructions,
        precautions: f.precautions,
        faqs: f.faqs.filter((x) => x.question.trim() && x.answer.trim()),
        seoTitle: f.seoTitle,
        seoDescription: f.seoDescription,
        seoKeywords: f.seoKeywords,
        images: f.galleryUrls.map((url, i) => ({ url, alt: "", sortOrder: i })),
      };
      return isNew ? createProduct(payload) : updateProduct(f.id, payload);
    },
    onSuccess: (r) => {
      toast.success("Product saved");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-product", r._id] });
      if (isNew) navigate(`/admin/products/${r._id}`, { replace: true });
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
            <Link to="/admin/products"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="font-display text-2xl">{isNew ? "New product" : f.name || "Edit product"}</h1>
        </div>
        <Button
          className="rounded-full"
          onClick={() => {
            if (!f.name.trim()) {
              toast.error("Product name is required");
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
              <Field label="Category">
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={f.category ?? ""}
                  onChange={(e) => {
                    const cid = e.target.value || null;
                    const cat = cats.find((c) => c._id === cid);
                    setF((s) => ({ ...s, category: cid, categoryLabel: cat?.name ?? s.categoryLabel }));
                  }}
                >
                  <option value="">— None —</option>
                  {cats.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Category label (display)">
                <Input value={f.categoryLabel} onChange={(e) => setF((s) => ({ ...s, categoryLabel: e.target.value }))} />
              </Field>
            </div>
            <Field label="Short description">
              <Textarea value={f.shortDescription} onChange={(e) => setF((s) => ({ ...s, shortDescription: e.target.value }))} rows={2} />
            </Field>
            <Field label="Full description">
              <Textarea value={f.fullDescription} onChange={(e) => setF((s) => ({ ...s, fullDescription: e.target.value }))} rows={6} />
            </Field>
          </Card>

          <Card title="Ayurvedic details">
            <Field label="Ingredients">
              <StringListEditor value={f.ingredients} onChange={(v) => setF((s) => ({ ...s, ingredients: v }))} placeholder="e.g. Ashwagandha" />
            </Field>
            <Field label="Benefits">
              <StringListEditor value={f.benefits} onChange={(v) => setF((s) => ({ ...s, benefits: v }))} placeholder="e.g. Boosts immunity" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Dosage">
                <Textarea value={f.dosage} onChange={(e) => setF((s) => ({ ...s, dosage: e.target.value }))} rows={3} />
              </Field>
              <Field label="Usage instructions">
                <Textarea value={f.usageInstructions} onChange={(e) => setF((s) => ({ ...s, usageInstructions: e.target.value }))} rows={3} />
              </Field>
            </div>
            <Field label="Precautions">
              <Textarea value={f.precautions} onChange={(e) => setF((s) => ({ ...s, precautions: e.target.value }))} rows={2} />
            </Field>
          </Card>

          <Card title="Images">
            <Field label="Featured image">
              <SingleImageUploader value={f.featuredImageUrl} onChange={(url) => setF((s) => ({ ...s, featuredImageUrl: url }))} folder="products" />
            </Field>
            <Field label="Gallery images">
              <MultiImageUploader value={f.galleryUrls} onChange={(v) => setF((s) => ({ ...s, galleryUrls: v }))} folder="products" />
            </Field>
          </Card>

          <Card title="FAQs">
            <FaqEditor value={f.faqs} onChange={(v) => setF((s) => ({ ...s, faqs: v }))} />
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
          <Card title="Pricing & inventory">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price (₹)">
                <Input type="number" min={0} step="0.01" value={f.priceRupees} onChange={(e) => setF((s) => ({ ...s, priceRupees: e.target.value }))} />
              </Field>
              <Field label="Discount price (₹)">
                <Input type="number" min={0} step="0.01" value={f.discountPriceRupees} onChange={(e) => setF((s) => ({ ...s, discountPriceRupees: e.target.value }))} />
              </Field>
              <Field label="SKU">
                <Input value={f.sku} onChange={(e) => setF((s) => ({ ...s, sku: e.target.value }))} />
              </Field>
              <Field label="Stock quantity">
                <Input type="number" min={0} value={f.stockQuantity} onChange={(e) => setF((s) => ({ ...s, stockQuantity: parseInt(e.target.value || "0") }))} />
              </Field>
            </div>
          </Card>

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
            <Field label="Tags">
              <StringListEditor value={f.tags} onChange={(v) => setF((s) => ({ ...s, tags: v }))} placeholder="e.g. immunity" />
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
