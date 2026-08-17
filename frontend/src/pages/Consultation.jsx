import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Section, Eyebrow } from "@/components/site/Section";
import { submitContact } from "@/lib/queries";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  age: z.coerce.number().int().min(1, "Please enter your age").max(120, "Please enter a valid age"),
  gender: z.string().trim().max(40).optional(),
  phone: z.string().trim().min(6, "Please enter a valid phone number").max(20),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  symptoms: z.string().trim().min(4, "Please describe your symptoms").max(2000),
  symptomDuration: z.string().trim().max(100).optional(),
  medicalHistory: z.string().trim().max(2000).optional(),
  currentMedicines: z.string().trim().max(2000).optional(),
  allergies: z.string().trim().max(1000).optional(),
  otherDetails: z.string().trim().max(2500).optional(),
});

const optionalFields = [
  ["medicalHistory", "Medical history", "Any diagnosis, previous treatment, surgery, or relevant health history.", 4],
  ["currentMedicines", "Current medicines / supplements", "List medicines, supplements, or Ayurvedic products you currently use.", 4],
  ["allergies", "Allergies", "Medicines, foods, herbs, or other known allergies.", 3],
  ["otherDetails", "Other details", "Anything else you would like the Vaidya to know before your consultation.", 5],
];

export default function Consultation() {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  async function onSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      name: form.get("name"),
      age: form.get("age"),
      gender: form.get("gender"),
      phone: form.get("phone"),
      email: form.get("email"),
      symptoms: form.get("symptoms"),
      symptomDuration: form.get("symptomDuration"),
      medicalHistory: form.get("medicalHistory"),
      currentMedicines: form.get("currentMedicines"),
      allergies: form.get("allergies"),
      otherDetails: form.get("otherDetails"),
    });

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
        ...parsed.data,
        subject: "New Book Consultation request",
        message: [
          `Symptoms: ${parsed.data.symptoms}`,
          parsed.data.symptomDuration ? `Duration: ${parsed.data.symptomDuration}` : "",
          parsed.data.medicalHistory ? `Medical history: ${parsed.data.medicalHistory}` : "",
          parsed.data.currentMedicines ? `Current medicines / supplements: ${parsed.data.currentMedicines}` : "",
          parsed.data.allergies ? `Allergies: ${parsed.data.allergies}` : "",
          parsed.data.otherDetails ? `Other details: ${parsed.data.otherDetails}` : "",
        ].filter(Boolean).join("\n\n"),
      });
      e.target.reset();
      toast.success("Thank you — your consultation request has been sent.");
    } catch (err) {
      toast.error(err.message || "We couldn't send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const errorFor = (name) =>
    errors[name] ? <p className="mt-1 text-sm text-destructive">{errors[name]}</p> : null;

  return (
    <>
      <Section className="pt-16 pb-8">
        <div className="max-w-3xl">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <div className="mt-8">
            <Eyebrow>Book Consultation</Eyebrow>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl md:text-6xl">
              Tell us a little about <span className="italic text-primary">you</span>.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Share your basic details and symptoms. Our team will review your request and connect you with the right Vaidya.
            </p>
          </div>
        </div>
      </Section>

      <Section className="pt-4 pb-20">
        <form onSubmit={onSubmit} className="mx-auto max-w-4xl rounded-[2rem] border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-10">
          <div className="mb-8 rounded-2xl bg-[var(--gradient-warm)] p-5 text-sm leading-relaxed text-muted-foreground">
            Please provide as much detail as you are comfortable sharing. This helps our team prepare for your consultation.
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="consult-name">Full name</Label>
              <Input id="consult-name" name="name" placeholder="Your name" className="mt-2 h-12 rounded-xl" />
              {errorFor("name")}
            </div>

            <div>
              <Label htmlFor="consult-age">Age</Label>
              <Input id="consult-age" name="age" type="number" min="1" max="120" placeholder="Your age" className="mt-2 h-12 rounded-xl" />
              {errorFor("age")}
            </div>

            <div>
              <Label htmlFor="consult-gender">Gender</Label>
              <Input id="consult-gender" name="gender" placeholder="Optional" className="mt-2 h-12 rounded-xl" />
              {errorFor("gender")}
            </div>

            <div>
              <Label htmlFor="consult-phone">Phone</Label>
              <Input id="consult-phone" name="phone" placeholder="+91 ..." className="mt-2 h-12 rounded-xl" />
              {errorFor("phone")}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="consult-email">Email</Label>
              <Input id="consult-email" name="email" type="email" placeholder="you@example.com" className="mt-2 h-12 rounded-xl" />
              {errorFor("email")}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="consult-symptoms">Symptoms / main concern</Label>
              <Textarea id="consult-symptoms" name="symptoms" placeholder="Describe your symptoms, concerns, or what you would like help with." rows={6} className="mt-2 rounded-xl" />
              {errorFor("symptoms")}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="consult-duration">How long have you had these symptoms?</Label>
              <Input id="consult-duration" name="symptomDuration" placeholder="For example: 3 weeks, 6 months, etc." className="mt-2 h-12 rounded-xl" />
              {errorFor("symptomDuration")}
            </div>

            {optionalFields.map(([name, label, placeholder, rows]) => (
              <div key={name} className="sm:col-span-2">
                <Label htmlFor={`consult-${name}`}>{label}</Label>
                <Textarea id={`consult-${name}`} name={name} placeholder={placeholder} rows={rows} className="mt-2 rounded-xl" />
                {errorFor(name)}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Your consultation information is sent securely to the JATA Ayurveda team for follow-up.
            </p>
            <Button type="submit" disabled={submitting} size="lg" className="rounded-full bg-primary px-8 py-6 text-base text-primary-foreground shadow-[var(--shadow-elegant)] hover:bg-primary/90">
              <Send className="mr-2 h-4 w-4" />
              {submitting ? "Sending..." : "Submit Consultation Request"}
            </Button>
          </div>
        </form>
      </Section>
    </>
  );
}
