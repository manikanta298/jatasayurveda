import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { getSettings, updateSetting } from "@/lib/queries";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { HeroMediaSlidesUploader, MultiImageUploader } from "@/components/admin/MediaUploader";

async function fetchAdminSettings() {
  const data = await getSettings();
  const merged = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  for (const key of Object.keys(data || {})) {
    if (key in merged) merged[key] = { ...merged[key], ...data[key] };
  }
  return merged;
}

export default function SettingsAdmin() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: fetchAdminSettings,
  });

  const [values, setValues] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    if (data) setValues(data);
  }, [data]);

  const mut = useMutation({
    mutationFn: (key) => updateSetting(key, values[key]),
    onSuccess: (_r, key) => {
      toast.success(`${key} settings saved`);
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e) => toast.error(e.message),
  });

  function bind(group, field) {
    return {
      value: values[group]?.[field] ?? "",
      onChange: (e) => {
        setValues((prev) => ({
          ...prev,
          [group]: { ...prev[group], [field]: e.target.value },
        }));
      },
    };
  }

  function setField(group, field, value) {
    setValues((prev) => ({
      ...prev,
      [group]: { ...prev[group], [field]: value },
    }));
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading settings…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Website settings</h1>
        <p className="text-sm text-muted-foreground">
          All fields here drive the live site. Changes save per group.
        </p>
      </div>

      <SettingsGroup title="Brand" onSave={() => mut.mutate("brand")} pending={mut.isPending}>
        <Field label="Site name">
          <Input {...bind("brand", "name")} />
        </Field>
        <Field label="Tagline">
          <Input {...bind("brand", "tagline")} />
        </Field>
        <Field label="Logo URL (leave empty to use bundled logo)">
          <Input {...bind("brand", "logo_url")} />
        </Field>
        <Field label="Favicon URL">
          <Input {...bind("brand", "favicon_url")} />
        </Field>
      </SettingsGroup>

      <SettingsGroup title="Home — Hero section" onSave={() => mut.mutate("home_hero")} pending={mut.isPending}>
        <Field label="Eyebrow line 1">
          <Input {...bind("home_hero", "eyebrow_line1")} />
        </Field>
        <Field label="Eyebrow line 2">
          <Input {...bind("home_hero", "eyebrow_line2")} />
        </Field>
        <Field label="Heading" full>
          <Input {...bind("home_hero", "heading")} />
        </Field>
        <Field label="Description" full>
          <Textarea rows={2} {...bind("home_hero", "description")} />
        </Field>
        <Field label="Primary button label">
          <Input {...bind("home_hero", "primary_cta_label")} />
        </Field>
        <Field label="Primary button link">
          <Input {...bind("home_hero", "primary_cta_href")} placeholder="/consultation" />
        </Field>
        <Field label="Secondary button label">
          <Input {...bind("home_hero", "secondary_cta_label")} />
        </Field>
        <Field label="Secondary button link">
          <Input {...bind("home_hero", "secondary_cta_href")} placeholder="/products" />
        </Field>

        <Field label="Hero slider media (images & videos)" full>
          <HeroMediaSlidesUploader
            value={values.home_hero.slides || []}
            onChange={(next) => setField("home_hero", "slides", next)}
            folder="home-hero"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Upload as many hero background images or videos as needed. The homepage will slide through them automatically.
          </p>
        </Field>
      </SettingsGroup>

      <SettingsGroup title="About — Intro section" onSave={() => mut.mutate("about_intro")} pending={mut.isPending}>
        <Field label="Eyebrow">
          <Input {...bind("about_intro", "eyebrow")} />
        </Field>
        <Field label="Heading">
          <Input {...bind("about_intro", "heading")} />
        </Field>
        <Field label="Heading highlight (italic accent, optional)" full>
          <Input {...bind("about_intro", "heading_highlight")} />
        </Field>
        <Field label="Description" full>
          <Textarea rows={3} {...bind("about_intro", "description")} />
        </Field>
        <Field label="Gallery images (first image is the large one)" full>
          <MultiImageUploader
            value={values.about_intro.images || []}
            onChange={(next) => setField("about_intro", "images", next)}
            folder="about-intro"
          />
        </Field>
      </SettingsGroup>

      <SettingsGroup title="Contact" onSave={() => mut.mutate("contact")} pending={mut.isPending}>
        <Field label="Phone">
          <Input {...bind("contact", "phone")} />
        </Field>
        <Field label="Email">
          <Input {...bind("contact", "email")} />
        </Field>
        <Field label="WhatsApp number">
          <Input {...bind("contact", "whatsapp")} />
        </Field>
        <Field label="Address" full>
          <Textarea rows={2} {...bind("contact", "address")} />
        </Field>
        <Field label="Business hours">
          <Input {...bind("contact", "business_hours")} />
        </Field>
        <Field label="Google Maps embed URL" full>
          <Input {...bind("contact", "google_maps_embed_url")} placeholder="https://www.google.com/maps/embed?..." />
        </Field>
      </SettingsGroup>

      <SettingsGroup title="Social links" onSave={() => mut.mutate("socials")} pending={mut.isPending}>
        <Field label="Instagram">
          <Input {...bind("socials", "instagram")} />
        </Field>
        <Field label="Facebook">
          <Input {...bind("socials", "facebook")} />
        </Field>
        <Field label="YouTube">
          <Input {...bind("socials", "youtube")} />
        </Field>
        <Field label="Twitter / X">
          <Input {...bind("socials", "twitter")} />
        </Field>
        <Field label="LinkedIn">
          <Input {...bind("socials", "linkedin")} />
        </Field>
      </SettingsGroup>

      <SettingsGroup title="SEO defaults" onSave={() => mut.mutate("seo")} pending={mut.isPending}>
        <Field label="Default title" full>
          <Input {...bind("seo", "default_title")} />
        </Field>
        <Field label="Default description" full>
          <Textarea rows={2} {...bind("seo", "default_description")} />
        </Field>
        <Field label="Default OG image URL" full>
          <Input {...bind("seo", "default_og_image")} />
        </Field>
      </SettingsGroup>

      <SettingsGroup title="Analytics" onSave={() => mut.mutate("analytics")} pending={mut.isPending}>
        <Field label="Google Analytics Measurement ID">
          <Input {...bind("analytics", "ga_measurement_id")} placeholder="G-XXXXXXX" />
        </Field>
        <Field label="GTM container ID">
          <Input {...bind("analytics", "gtm_container_id")} placeholder="GTM-XXXXXXX" />
        </Field>
      </SettingsGroup>

      <SettingsGroup title="Commerce" onSave={() => mut.mutate("commerce")} pending={mut.isPending}>
        <Field label="Currency">
          <Input {...bind("commerce", "currency")} />
        </Field>
        <Field label="Free shipping over (paise)">
          <Input
            type="number"
            value={values.commerce.free_shipping_over_paise ?? 0}
            onChange={(e) =>
              setValues((p) => ({
                ...p,
                commerce: { ...p.commerce, free_shipping_over_paise: Number(e.target.value) },
              }))
            }
          />
        </Field>
        <Field label="Flat shipping (paise)">
          <Input
            type="number"
            value={values.commerce.flat_shipping_paise ?? 0}
            onChange={(e) =>
              setValues((p) => ({
                ...p,
                commerce: { ...p.commerce, flat_shipping_paise: Number(e.target.value) },
              }))
            }
          />
        </Field>
        <Field label="GST %">
          <Input
            type="number"
            value={values.commerce.gst_percent ?? 0}
            onChange={(e) =>
              setValues((p) => ({
                ...p,
                commerce: { ...p.commerce, gst_percent: Number(e.target.value) },
              }))
            }
          />
        </Field>
      </SettingsGroup>

      <SettingsGroup title="Footer" onSave={() => mut.mutate("footer")} pending={mut.isPending}>
        <Field label="Copyright" full>
          <Input {...bind("footer", "copyright")} />
        </Field>
        <Field label="Note" full>
          <Input {...bind("footer", "note")} />
        </Field>
      </SettingsGroup>

      <SettingsGroup title="Site" onSave={() => mut.mutate("site")} pending={mut.isPending}>
        <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4 sm:col-span-2">
          <div>
            <Label>Maintenance mode</Label>
            <p className="text-xs text-muted-foreground">
              Show a maintenance page to visitors while enabled.
            </p>
          </div>
          <Switch
            checked={!!values.site.maintenance_mode}
            onCheckedChange={(v) =>
              setValues((p) => ({
                ...p,
                site: { ...p.site, maintenance_mode: v },
              }))
            }
          />
        </div>
        <Field label="Maintenance message" full>
          <Textarea rows={2} {...bind("site", "maintenance_message")} />
        </Field>
      </SettingsGroup>
    </div>
  );
}

function SettingsGroup({ title, children, onSave, pending }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl">{title}</h2>
        <Button size="sm" onClick={onSave} disabled={pending} className="rounded-full">
          <Save className="mr-2 h-4 w-4" /> Save
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ label, children, full }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
