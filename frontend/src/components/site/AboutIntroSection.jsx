import { Section, Eyebrow } from "@/components/site/Section";
import { useSettings } from "@/lib/settings";
import doctorConsultationImage from "@/assets/images/doctor-consultation.jpg";
import herbsFlatlayImage from "@/assets/images/herbs-flatlay.jpg";
import shirodharaTreatmentImage from "@/assets/images/shirodhara-treatment.jpg";

const FALLBACK_IMAGES = [doctorConsultationImage, herbsFlatlayImage, shirodharaTreatmentImage];

// Renders the About page's opening heading/paragraph and its 3-image
// gallery. Editable from Admin → Settings → "About — Intro section" (backed
// by the `about_intro` site setting). Falls back to the original launch
// copy/images when nothing has been saved yet.
export function AboutIntroSection() {
  const { about_intro: intro } = useSettings();
  const images = intro.images?.length > 0 ? intro.images : FALLBACK_IMAGES;
  const [main, ...rest] = images;

  return (
    <Section className="pt-16 pb-8">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <Eyebrow>{intro.eyebrow}</Eyebrow>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl md:text-6xl">
            {intro.heading}{" "}
            {intro.heading_highlight && <span className="italic text-primary">{intro.heading_highlight}</span>}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{intro.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {main && (
            <img
              src={main}
              alt="About JATA Ayurveda"
              loading="lazy"
              className="col-span-2 aspect-[16/11] w-full rounded-3xl object-cover shadow-[var(--shadow-soft)]"
            />
          )}
          {rest.slice(0, 2).map((url, i) => (
            <img
              key={`${url}-${i}`}
              src={url}
              alt="About JATA Ayurveda"
              loading="lazy"
              className="aspect-square w-full rounded-3xl object-cover shadow-[var(--shadow-soft)]"
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
