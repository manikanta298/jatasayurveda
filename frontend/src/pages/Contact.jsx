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
  age: z.coerce.number().int("Age must be a whole number").min(1, "Enter a valid age").max(120, "Enter a valid age"),
  gender: z.string().trim().max(50).optional(),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().min(6, "Please enter a valid phone").max(20),
  symptoms: z.string().trim().min(4, "Please describe your symptoms").max(2000),
  symptomsDuration: z.string().trim().max(100).optional(),
  medicalHistory: z.string().trim().max(2000).optional(),
  currentMedications: z.string().trim().max(2000).optional(),
  allergies: z.string().trim().max(1000).optional(),
  additionalDetails: z.string().trim().max(3000).optional(),
});

const initialValues = {
  name: "",
  age: "",
  gender: "",
  email: "",
  phone: "",
  symptoms: "",
  symptomsDuration: "",
  medicalHistory: "",
  currentMedications: "",
  allergies: "",
  additionalDetails: "",
};

export default function Contact() {
  const { contact } = useSettings();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  async function onSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const values = {
      name: form.get("name"),
      age: form.get("age"),
      gender: form.get("gender") || "",
      email: form.get("email"),
      phone: form.get("phone"),
      symptoms: form.get("symptoms"),
      symptomsDuration: form.get("symptomsDuration") || "",
      medicalHistory: form.get("medicalHistory") || "",
      currentMedications: form.get("currentMedications") || "",
      allergies: form.get("allergies") || "",
      additionalDetails: form.get("additionalDetails") || "",
    };

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = {};
      parsed.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[String(issue.path[0])] = issue.message;
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
        subject: "New consultation request",
        age: parsed.data.age,
        gender: parsed.data.gender,
        symptoms: parsed.data.symptoms,
        symptomsDuration: parsed.data.symptomsDuration,
        medicalHistory: parsed.data.medicalHistory,
        currentMedications: parsed.data.currentMedications,
        allergies: parsed.data.allergies,
        additionalDetails: parsed.data.additionalDetails,
        message: parsed.data.symptoms,
      });
      e.currentTarget.reset();
      toast.success("Your consultation request has been sent. A Vaidya will contact you soon.");
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Section className="pt-16 pb-8">
        <div className="max-w-3xl">
          <Eyebrow>Book a Consultation</Eyebrow>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl md:text-6xl">
            Tell us what you’re <span className="italic text-primary">experiencing</span>.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Share a few details about your health concerns. Our team will review your request and connect you with the right Vaidya.
          </p>
        </div>
      </Section>

      <Section className="pt-4 pb-20">
        <div className="grid gap-8 lg:grid-cols-[1.45fr_0.75fr]">
          <form onSubmit={onSubmit} className="rounded-[2rem] border border-border bg-card p-8 shadow-[var(--shadow-soft)] sm:p-10">
            <div className="mb-8">
              <h2 className="font-display text-2xl text-foreground sm:text-3xl">Consultation details</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Please provide accurate information so the physician can understand your concern before speaking with you.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" name="name" placeholder="Your name" error={errors.name} />
              <Field label="Age" name="age" type="number" min="1" max="120" placeholder="Your age" error={errors.age} />

              <Field label="Gender" name="gender" placeholder="Optional" error={errors.gender} />
              <Field label="Phone number" name="phone" placeholder="+91 ..." error={errors.phone} />

              <div className="sm:col-span-2">
                <Field label="Email address" name="email" type="email" placeholder="you@example.com" error={errors.email} />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="symptoms">Symptoms / main concern</Label>
                <Textarea id="symptoms" name="symptoms" placeholder="What symptoms are you experiencing?" rows={5} className="mt-2 rounded-xl" />
                {errors.symptoms && <p className="mt-1 text-sm text-destructive">{errors.symptoms}</p>}
              </div>

              <Field label="How long have you had these symptoms?" name="symptomsDuration" placeholder="e.g. 3 weeks" error={errors.symptomsDuration} />
              <Field label="Known allergies" name="allergies" placeholder="Optional" error={errors.allergies} />

              <div className="sm:col-span-2">
                <Label htmlFor="medicalHistory">Medical history / previous diagnosis</Label>
                <Textarea id="medicalHistory" name="medicalHistory" placeholder="Share relevant medical history, diagnoses, surgeries, or tests." rows={4} className="mt-2 rounded-xl" />
                {errors.medicalHistory && <p className="mt-1 text-sm text-destructive">{errors.medicalHistory}</p>}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="currentMedications">Current medicines / supplements</Label>
                <Textarea id="currentMedications" name="currentMedications" placeholder="List any medicines, supplements, or ongoing treatments." rows={4} className="mt-2 rounded-xl" />
                {errors.currentMedications && <p className="mt-1 text-sm text-destructive">{errors.currentMedications}</p>}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="additionalDetails">Anything else we should know?</Label>
                <Textarea id="additionalDetails" name="additionalDetails" placeholder="Lifestyle details, goals, questions, or anything else you'd like the Vaidya to know." rows={4} className="mt-2 rounded-xl" />
                {errors.additionalDetails && <p className="mt-1 text-sm text-destructive">{errors.additionalDetails}</p>}
              </div>
            </div>

            <Button type="submit" disabled={submitting} size="lg" className="mt-8 rounded-full bg-primary px-7 py-6 text-base text-primary-foreground shadow-[var(--shadow-elegant)] hover:bg-primary/90">
              <Send className="mr-2 h-4 w-4" /> {submitting ? "Sending..." : "Submit consultation request"}
            </Button>
          </form>

          <aside className="grid content-start gap-4">
            <div className="rounded-3xl border border-border bg-[var(--gradient-warm)] p-8">
              <h3 className="font-display text-xl text-foreground">What happens next?</h3>
              <div className="mt-6 space-y-5 text-sm text-muted-foreground">
                <div>
                  <div className="font-medium text-foreground">1. We review your details</div>
                  <p className="mt-1">Your consultation request is sent securely to the JATA Ayurveda team.</p>
                </div>
                <div>
                  <div className="font-medium text-foreground">2. A Vaidya reviews your concern</div>
                  <p className="mt-1">We use the information you share to understand which physician is the right fit.</p>
                </div>
                <div>
                  <div className="font-medium text-foreground">3. We contact you</div>
                  <p className="mt-1">Our team will reach out using the phone or email you provided.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
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

function Field({ label, name, error, ...props }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} className="mt-2 h-12 rounded-xl" />
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}

export { initialValues };
