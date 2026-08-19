import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Section, Eyebrow } from "@/components/site/Section";
import { useSettings } from "@/lib/settings";
import { submitContact } from "@/lib/queries";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().min(6, "Please enter a valid phone").max(20),
  concern: z.string().trim().min(4, "Tell us a little about your concern").max(1000),
});

export default function Contact() {
  const { contact } = useSettings();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  async function onSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      concern: form.get("concern"),
    });
    if (!parsed.success) {
      const fieldErrors = {};
      parsed.error.issues.forEach((i) => {
        if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await submitContact({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        message: parsed.data.concern,
      });
      e.target.reset();
      toast.success("Thank you — a Vaidya will be in touch within 24 hours.");
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Section className="pt-16 pb-4">
        <div className="max-w-3xl">
          <Eyebrow>Contact</Eyebrow>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl md:text-6xl">
            Let's begin with a <span className="italic text-primary">conversation</span>.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Tell us what you're navigating. We'll get back within 24 hours to book your consultation with the right physician.
          </p>
        </div>
      </Section>

      <Section className="pt-4">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <form onSubmit={onSubmit} className="rounded-[2rem] border border-border bg-card p-8 shadow-[var(--shadow-soft)] sm:p-10">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" placeholder="Your name" className="mt-2 h-12 rounded-xl" />
                {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" placeholder="+91 ..." className="mt-2 h-12 rounded-xl" />
                {errors.phone && <p className="mt-1 text-sm text-destructive">{errors.phone}</p>}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" className="mt-2 h-12 rounded-xl" />
                {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="concern">What can we help with?</Label>
                <Textarea id="concern" name="concern" placeholder="Briefly describe your concern or the programme you're interested in." rows={5} className="mt-2 rounded-xl" />
                {errors.concern && <p className="mt-1 text-sm text-destructive">{errors.concern}</p>}
              </div>
            </div>
            <Button type="submit" disabled={submitting} size="lg" className="mt-8 rounded-full bg-primary px-7 py-6 text-base text-primary-foreground shadow-[var(--shadow-elegant)] hover:bg-primary/90">
              <Send className="mr-2 h-4 w-4" /> {submitting ? "Sending..." : "Send message"}
            </Button>
          </form>

          <aside className="grid content-start gap-4">
            <div className="rounded-3xl border border-border bg-[var(--gradient-warm)] p-8">
              <h3 className="font-display text-xl text-foreground">Reach us directly</h3>
              <ul className="mt-6 space-y-4 text-sm text-muted-foreground">
                {contact.phone && (
                  <li className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span><span className="block text-xs uppercase tracking-wider text-foreground/60">Phone</span>{contact.phone}</span>
                  </li>
                )}
                {contact.email && (
                  <li className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span><span className="block text-xs uppercase tracking-wider text-foreground/60">Email</span>{contact.email}</span>
                  </li>
                )}
                {contact.address && (
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span><span className="block text-xs uppercase tracking-wider text-foreground/60">Visit</span>{contact.address}</span>
                  </li>
                )}
              </ul>
            </div>
            {contact.business_hours && (
              <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
                <h3 className="font-display text-lg text-foreground">Consultation hours</h3>
                <p className="mt-3 text-sm text-muted-foreground">{contact.business_hours}</p>
              </div>
            )}
            {contact.google_maps_embed_url && (
              <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
                <iframe
                  src={contact.google_maps_embed_url}
                  title="Map"
                  className="h-64 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </aside>
        </div>
      </Section>
    </>
  );
}
