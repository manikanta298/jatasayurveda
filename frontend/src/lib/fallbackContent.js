import doctorConsultationImage from "@/assets/images/doctor-consultation.jpg";
import herbsFlatlayImage from "@/assets/images/herbs-flatlay.jpg";
import shirodharaTreatmentImage from "@/assets/images/shirodhara-treatment.jpg";
import researchLabImage from "@/assets/images/research-lab.jpg";
import heroAyurvedaImage from "@/assets/images/hero-ayurveda.jpg";
import productsHeroImage from "@/assets/images/products-hero.jpg";

export const FALLBACK_DOCTORS = [
  {
    _id: "doctor-1",
    name: "Dr. Ananya Rao",
    role: "Senior Vaidya",
    bio: "Classical Ayurveda consultations with a strong focus on digestive health, stress recovery and women’s wellness.",
  },
  {
    _id: "doctor-2",
    name: "Dr. Suresh Nair",
    role: "Panchakarma Specialist",
    bio: "Residential detox and rejuvenation protocols guided by traditional diagnostics and modern monitoring.",
  },
  {
    _id: "doctor-3",
    name: "Dr. Meera Iyer",
    role: "Clinical Research Lead",
    bio: "Outcome tracking, protocol standardisation and evidence-led formulation development.",
  },
];

export const FALLBACK_CERTIFICATIONS = [
  { _id: "cert-1", label: "GMP Certified" },
  { _id: "cert-2", label: "AYUSH Compliant" },
  { _id: "cert-3", label: "ISO Practices" },
  { _id: "cert-4", label: "Clinician Reviewed" },
  { _id: "cert-5", label: "Quality Tested" },
];

export const FALLBACK_TESTIMONIALS = [
  {
    _id: "test-1",
    quote: "The consultation felt thoughtful and personal, and the follow-up plan was easy to follow.",
    name: "Anita M.",
    role: "Long-term patient",
    rating: 5,
  },
  {
    _id: "test-2",
    quote: "I finally found an Ayurveda programme that felt structured, transparent and realistic.",
    name: "Rahul S.",
    role: "Wellness client",
    rating: 5,
  },
  {
    _id: "test-3",
    quote: "The team explained every step clearly and kept the treatment plan practical.",
    name: "Priya K.",
    role: "Panchakarma guest",
    rating: 5,
  },
];

export const FALLBACK_SERVICES = [
  {
    slug: "panchakarma",
    name: "Panchakarma Care",
    shortDescription: "Personalised detox and rejuvenation programmes for deep reset and recovery.",
    fullDescription:
      "A physician-led protocol that combines classical Panchakarma therapies, diet guidance and recovery support for sustainable wellness.",
    bannerImageUrl: doctorConsultationImage,
  },
  {
    slug: "women-health",
    name: "Women’s Wellness",
    shortDescription: "Support for menstrual health, fertility, peri-menopause and vitality.",
    fullDescription:
      "Gentle, phased care plans designed around a woman’s constitution, symptoms and life stage.",
    bannerImageUrl: herbsFlatlayImage,
  },
  {
    slug: "stress-sleep",
    name: "Stress & Sleep Recovery",
    shortDescription: "Restore calm, improve sleep quality and rebuild energy.",
    fullDescription:
      "A grounding programme built around sleep hygiene, herbs, routine design and restorative therapies.",
    bannerImageUrl: shirodharaTreatmentImage,
  },
  {
    slug: "research-led-care",
    name: "Research-Led Care",
    shortDescription: "Clinical protocols that balance tradition with measurable outcomes.",
    fullDescription:
      "Ideal for users who want a structured consultation journey backed by consistent follow-up and measurable progress.",
    bannerImageUrl: researchLabImage,
  },
];

export const FALLBACK_PRODUCTS = [
  {
    slug: "triphala-churna",
    name: "Triphala Churna",
    categoryLabel: "Digestive Care",
    shortDescription: "A classical herbal blend for gentle daily support.",
    featuredImageUrl: herbsFlatlayImage,
    pricePaise: 34900,
    discountPricePaise: 29900,
  },
  {
    slug: "ashwagandha-tonic",
    name: "Ashwagandha Tonic",
    categoryLabel: "Restorative",
    shortDescription: "A balancing formulation for stress recovery and stamina.",
    featuredImageUrl: heroAyurvedaImage,
    pricePaise: 44900,
    discountPricePaise: 39900,
  },
  {
    slug: "panchakarma-kit",
    name: "Panchakarma Kit",
    categoryLabel: "Therapy Support",
    shortDescription: "A curated home-care kit to complement supervised therapy.",
    featuredImageUrl: productsHeroImage,
    pricePaise: 79900,
    discountPricePaise: 69900,
  },
];

export const FALLBACK_BLOG_POSTS = [
  {
    slug: "ayurveda-daily-routine",
    title: "How to build a grounding daily routine",
    excerpt: "Small, repeatable habits often create the biggest change in long-term wellness.",
    readingTime: "4 min read",
    publishedAt: new Date().toISOString(),
    imageUrl: researchLabImage,
    content: "",
  },
  {
    slug: "panchakarma-basics",
    title: "What to expect from a Panchakarma programme",
    excerpt: "A simple overview of the consultation, preparation and recovery phases.",
    readingTime: "5 min read",
    publishedAt: new Date().toISOString(),
    imageUrl: doctorConsultationImage,
    content: "",
  },
  {
    slug: "herbs-and-lifestyle",
    title: "Why herbs work best with lifestyle support",
    excerpt: "Ayurveda is most effective when medicine and routine work together.",
    readingTime: "3 min read",
    publishedAt: new Date().toISOString(),
    imageUrl: herbsFlatlayImage,
    content: "",
  },
];

export const FALLBACK_RESEARCH = [
  {
    _id: "research-1",
    year: "2024",
    title: "Digestive balance protocol",
    summary: "Tracked symptom response across a small, physician-supervised cohort.",
  },
  {
    _id: "research-2",
    year: "2023",
    title: "Sleep recovery outcome review",
    summary: "Measured changes in rest quality after a structured sleep programme.",
  },
  {
    _id: "research-3",
    year: "2022",
    title: "Herbal standardisation study",
    summary: "Reviewed batch consistency and process controls for key formulations.",
  },
];
