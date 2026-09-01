// Seeds the database with the same content the original Lovable app shipped
// with (site-data.ts), plus one initial admin account. Safe to re-run —
// every write is an upsert keyed on a unique field (slug/code/key/email).
//
// Usage: npm run seed   (reads MONGO_URI, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD from .env)
require("dotenv").config();
const connectDB = require("../config/db");

const ProductCategory = require("../models/ProductCategory");
const Product = require("../models/Product");
const Service = require("../models/Service");
const Doctor = require("../models/Doctor");
const Testimonial = require("../models/Testimonial");
const BlogPost = require("../models/BlogPost");
const ResearchItem = require("../models/ResearchItem");
const Certification = require("../models/Certification");
const Coupon = require("../models/Coupon");
const SiteSetting = require("../models/SiteSetting");
const User = require("../models/User");

const IMG = {
  hero: "/images/hero-ayurveda.jpg",
  herbsFlatlay: "/images/herbs-flatlay.jpg",
  doctorConsultation: "/images/doctor-consultation.jpg",
  productsHero: "/images/products-hero.jpg",
  researchLab: "/images/research-lab.jpg",
  shirodhara: "/images/shirodhara-treatment.jpg",
};

const categories = [
  { name: "Immunity & Vitality", slug: "immunity-vitality", sortOrder: 1 },
  { name: "Digestion", slug: "digestion", sortOrder: 2 },
  { name: "Mind & Focus", slug: "mind-focus", sortOrder: 3 },
  { name: "Skin & Beauty", slug: "skin-beauty", sortOrder: 4 },
  { name: "Pain & Mobility", slug: "pain-mobility", sortOrder: 5 },
];

const products = [
  { slug: "ashwagandha-shakti", name: "Ashwagandha Shakti", pricePaise: 64900, shortDescription: "Adaptogenic root for stress, sleep and strength.", featuredImageUrl: IMG.productsHero, categoryLabel: "Immunity & Vitality", categorySlug: "immunity-vitality", ingredients: ["Wild-harvested Ashwagandha (Withania somnifera)", "Cow-ghee triturated"], benefits: ["Balances cortisol and calms the nervous system", "Supports deep, restorative sleep", "Builds physical strength and stamina"], usageInstructions: "Take one capsule with warm milk or water, twice daily, after meals.", dosage: "60 vegetarian capsules · 500 mg each", precautions: "Avoid during pregnancy without physician guidance. Consult your doctor if on immunosuppressants." },
  { slug: "triphala-gold", name: "Triphala Gold", pricePaise: 44900, shortDescription: "The classical three-fruit blend for gentle cleansing.", featuredImageUrl: IMG.productsHero, categoryLabel: "Digestion", categorySlug: "digestion", ingredients: ["Amalaki", "Bibhitaki", "Haritaki"], benefits: ["Supports smooth daily elimination", "Nurtures gut lining and microbiome", "Rich in natural Vitamin C"], usageInstructions: "Take one teaspoon with warm water before bed.", dosage: "200 g powder · pesticide-free", precautions: "Reduce dose if loose stools occur. Not recommended in acute diarrhoea." },
  { slug: "brahmi-clarity", name: "Brahmi Clarity", pricePaise: 54900, shortDescription: "Nootropic support for focus, memory and calm.", featuredImageUrl: IMG.productsHero, categoryLabel: "Mind & Focus", categorySlug: "mind-focus", ingredients: ["Brahmi (Bacopa monnieri)", "Shankhpushpi", "Mandukaparni"], benefits: ["Sharpens focus and working memory", "Reduces mental restlessness", "Supports students and knowledge workers"], usageInstructions: "One capsule twice a day with warm water.", dosage: "60 vegetarian capsules · 500 mg each", precautions: "Safe for long-term use. Consult before combining with sedatives." },
  { slug: "kumkumadi-elixir", name: "Kumkumadi Radiance Elixir", pricePaise: 129000, shortDescription: "Ancient face oil for a luminous, even complexion.", featuredImageUrl: IMG.productsHero, categoryLabel: "Skin & Beauty", categorySlug: "skin-beauty", ingredients: ["Kumkuma (Saffron)", "Manjistha", "Yashtimadhu", "Cold-pressed sesame oil"], benefits: ["Brightens dull, pigmented skin", "Reduces fine lines and dark spots", "Deeply nourishes without clogging pores"], usageInstructions: "Massage 3–5 drops onto clean skin every night before sleep.", dosage: "30 ml amber glass bottle", precautions: "Patch test before first use. Avoid contact with eyes." },
  { slug: "chyawanprash-royal", name: "Royal Chyawanprash", pricePaise: 89900, shortDescription: "50-herb immunity rasayana, hand-cooked in ghee.", featuredImageUrl: IMG.productsHero, categoryLabel: "Immunity & Vitality", categorySlug: "immunity-vitality", ingredients: ["Amla", "50+ classical herbs", "A2 cow ghee", "Wild forest honey"], benefits: ["Daily immunity for the whole family", "Supports respiratory strength", "Rich in natural antioxidants"], usageInstructions: "One teaspoon in the morning with warm milk.", dosage: "500 g glass jar", precautions: "Diabetics should consult before use." },
  { slug: "joint-relief-oil", name: "Sandhi Sukham Joint Oil", pricePaise: 54900, shortDescription: "Warming oil for stiff, aching joints and muscles.", featuredImageUrl: IMG.productsHero, categoryLabel: "Pain & Mobility", categorySlug: "pain-mobility", ingredients: ["Mahanarayan taila base", "Nirgundi", "Rasna", "Eranda"], benefits: ["Relieves joint stiffness and swelling", "Improves flexibility with regular use", "Deeply penetrating warm oil"], usageInstructions: "Warm slightly and massage into affected areas twice daily.", dosage: "200 ml amber bottle", precautions: "External use only." },
];

const services = [
  { slug: "panchakarma", name: "Panchakarma Detox", shortDescription: "A five-fold cleanse to reset the body and mind.", bannerImageUrl: IMG.shirodhara, fullDescription: "Panchakarma is Ayurveda's flagship detoxification protocol — a physician-led programme that removes accumulated toxins (ama), restores digestive fire (agni), and rebalances the three doshas. Delivered under the supervision of our senior Vaidyas across 7, 14 and 21-day journeys.", symptoms: ["Chronic fatigue and low energy", "Sluggish digestion and bloating", "Skin dullness and breakouts", "Brain fog, disturbed sleep", "Joint stiffness and heaviness"], causes: ["Prolonged stress and irregular routines", "Processed foods and incompatible diet", "Environmental toxins and pollutants", "Suppressed natural urges and poor sleep hygiene"], treatmentProcess: [{ title: "Consultation & Nadi Pariksha", description: "A senior physician assesses your prakriti, vikriti and pulse to design a personalised protocol.", order: 0 }, { title: "Purvakarma (Preparation)", description: "Snehana (medicated oils) and Swedana (herbal steam) mobilise deep-seated toxins.", order: 1 }, { title: "Pradhanakarma (Main Therapies)", description: "Vamana, Virechana, Basti, Nasya or Raktamokshana — chosen based on your constitution.", order: 2 }, { title: "Paschatkarma (Rejuvenation)", description: "Graded diet, herbal rasayanas and lifestyle guidance to lock in the benefits.", order: 3 }], benefits: ["Deep cellular detoxification", "Improved digestion and metabolism", "Radiant skin and lighter body", "Mental clarity and restful sleep", "Strengthened immunity and vitality"], faqs: [{ question: "How long is a Panchakarma programme?", answer: "Standard programmes run 7, 14 or 21 days. The right length is decided after your initial consultation." }, { question: "Is Panchakarma safe for everyone?", answer: "It is designed under strict medical supervision. Pregnant women, young children and certain chronic conditions require modified protocols." }, { question: "What should I bring?", answer: "Comfortable cotton clothing, your recent medical reports and an open mind. All therapy essentials are provided." }] },
  { slug: "chronic-care", name: "Chronic Disease Care", shortDescription: "Root-cause management for lifestyle and autoimmune conditions.", bannerImageUrl: IMG.doctorConsultation, fullDescription: "Long-term Ayurvedic protocols for diabetes, hypertension, PCOS, thyroid, arthritis, IBS, psoriasis and autoimmune disorders — integrating classical shastra with modern diagnostics.", symptoms: ["Persistent inflammation or pain", "Hormonal imbalance", "Digestive disorders", "Skin conditions that recur"], causes: ["Doshic imbalance sustained over years", "Poor gut health and weak agni", "Genetic predisposition + lifestyle triggers", "Chronic stress and inadequate rest"], treatmentProcess: [{ title: "Comprehensive Assessment", description: "Detailed history, labs review and Ayurvedic pulse diagnosis.", order: 0 }, { title: "Personalised Protocol", description: "Custom herbal formulations, panchakarma modules and diet plan.", order: 1 }, { title: "Monthly Reviews", description: "Progress tracked with objective markers and adjusted every month.", order: 2 }, { title: "Lifestyle Integration", description: "Yoga, pranayama and dinacharya guidance tailored to your dosha.", order: 3 }], benefits: ["Reduced dependence on symptomatic medication", "Sustainable disease reversal", "Better lab markers and quality of life", "Whole-family lifestyle transformation"], faqs: [{ question: "Can I continue my existing medication?", answer: "Yes. We integrate carefully with your existing prescriptions and taper only under your physician's guidance." }, { question: "How long before I see results?", answer: "Most patients notice measurable change within 8–12 weeks; sustained reversal takes 6–12 months." }] },
  { slug: "skin-hair", name: "Skin & Hair Wellness", shortDescription: "Classical Ayurvedic dermatology for lasting radiance.", bannerImageUrl: IMG.herbsFlatlay, fullDescription: "Targeted treatments for acne, pigmentation, eczema, psoriasis, hair fall, dandruff and premature greying — using authentic herbal formulations and specialised therapies like Mukhalepa, Shiroabhyanga and Takradhara.", symptoms: ["Acne, breakouts and pigmentation", "Chronic dandruff and hair fall", "Dry, sensitive or reactive skin", "Premature greying"], causes: ["Aggravated Pitta and Rakta", "Poor gut health reflecting on skin", "Hormonal shifts and stress", "Chemical-laden products and pollution"], treatmentProcess: [{ title: "Skin & Scalp Analysis", description: "Doshic mapping combined with modern trichological assessment.", order: 0 }, { title: "Internal Cleansing", description: "Herbal decoctions to purify the blood and strengthen digestion.", order: 1 }, { title: "External Therapies", description: "Mukhalepa, Shiroabhyanga, Takradhara and Nasya as indicated.", order: 2 }, { title: "Home Care Ritual", description: "A simple daily ritual of oils, ubtans and diet to sustain results.", order: 3 }], benefits: ["Clear, luminous complexion", "Reduced hair fall and scalp irritation", "Long-term skin resilience", "Zero synthetic actives"], faqs: [{ question: "Are these treatments suitable for sensitive skin?", answer: "Yes. Every formulation is customised after a patch test and skin analysis." }] },
  { slug: "womens-health", name: "Women's Health", shortDescription: "Care through every phase — cycle to menopause.", bannerImageUrl: IMG.shirodhara, fullDescription: "Ayurvedic care for menstrual disorders, PCOS, fertility support, pregnancy (Garbhini Paricharya), postnatal recovery (Sutika Paricharya) and menopause — with warm, women-led consultations.", symptoms: ["Irregular or painful cycles", "PCOS, thyroid, fertility challenges", "Postnatal fatigue and recovery", "Menopausal transitions"], causes: ["Vata–Pitta imbalance affecting Artava Dhatu", "Lifestyle and dietary triggers", "Chronic stress and sleep disruption"], treatmentProcess: [{ title: "Consultation with Women Vaidyas", description: "A private, unhurried consultation with senior women physicians.", order: 0 }, { title: "Cycle-linked Protocol", description: "Herbal support, Uttarabasti and Yoni Prakshalana where indicated.", order: 1 }, { title: "Nutrition & Movement", description: "Cycle-aware nutrition and yoga plans.", order: 2 }, { title: "Ongoing Companionship", description: "Monthly check-ins across the full journey.", order: 3 }], benefits: ["Balanced cycles and improved fertility", "Restored postnatal strength", "Gentle, natural menopause transition"], faqs: [{ question: "Do you support IVF journeys?", answer: "Yes — Ayurvedic protocols complement ART cycles and improve outcomes when timed correctly." }] },
];

const doctors = [
  { name: "Dr. Meera Nair, BAMS, MD (Ayu)", role: "Chief Physician · Panchakarma & Chronic Care", bio: "20+ years of clinical practice with a specialisation in autoimmune and lifestyle disorders. Trained at Government Ayurveda College, Thiruvananthapuram.", sortOrder: 0 },
  { name: "Dr. Aravind Sharma, BAMS, MD", role: "Senior Vaidya · Rasayana & Rejuvenation", bio: "Guides our rasayana and rejuvenation programmes. Published researcher in classical formulations and their modern applications.", sortOrder: 1 },
  { name: "Dr. Kavya Iyer, BAMS", role: "Women's Health & Fertility Lead", bio: "Focuses on gynaecological wellness, fertility support and post-natal recovery through evidence-informed Ayurveda.", sortOrder: 2 },
];

const testimonials = [
  { name: "Ananya R.", role: "Bengaluru · 14-day Panchakarma", quote: "I walked in exhausted after years of migraines. Two weeks later I felt genuinely reset — sleeping deeply and clear-headed for the first time in a decade.", rating: 5, sortOrder: 0 },
  { name: "Rajiv M.", role: "Hyderabad · Chronic Care", quote: "My HbA1c dropped from 9.1 to 6.4 in six months. Dr. Meera's team combined herbs, diet and yoga in a way that finally clicked.", rating: 5, sortOrder: 1 },
  { name: "Priya S.", role: "Mumbai · Skin Programme", quote: "My cystic acne has cleared and my skin looks calmer than it has in years. The team is warm, precise and never rushes a consultation.", rating: 5, sortOrder: 2 },
];

const blogPosts = [
  { slug: "understanding-your-dosha", title: "Understanding Your Dosha: A Beginner's Guide", excerpt: "Vata, Pitta, Kapha — the three doshas govern every function in the body. Here's how to read yours and use it as a compass.", publishedAt: new Date("2025-05-12"), readingTime: "6 min read", imageUrl: IMG.herbsFlatlay, status: "published" },
  { slug: "seasonal-eating-ritucharya", title: "Seasonal Eating (Ritucharya) for Modern Life", excerpt: "Ayurveda's original circadian diet — adapted for city living, home offices and grocery deliveries.", publishedAt: new Date("2025-04-28"), readingTime: "8 min read", imageUrl: IMG.doctorConsultation, status: "published" },
  { slug: "sleep-as-medicine", title: "Sleep Is Medicine: The Ayurvedic View", excerpt: "Why the classical texts consider sleep a pillar of health equal to food, and simple protocols to reclaim it.", publishedAt: new Date("2025-04-10"), readingTime: "5 min read", imageUrl: IMG.shirodhara, status: "published" },
];

const research = [
  { title: "Panchakarma & Metabolic Markers", summary: "A 12-week study on 84 participants showing measurable improvements in HbA1c, LDL and inflammatory markers post-Panchakarma.", year: "2024", sortOrder: 0 },
  { title: "Ashwagandha, Sleep & HRV", summary: "In-house double-blind trial documenting improvements in sleep latency and heart-rate variability with a 60-day protocol.", year: "2024", sortOrder: 1 },
  { title: "Kumkumadi Formulation Standardisation", summary: "Reproducible extraction and stability studies of the classical Kumkumadi taila as a modern cosmeceutical.", year: "2023", sortOrder: 2 },
];

const certifications = [
  { label: "GMP Certified Manufacturing", sortOrder: 0 },
  { label: "AYUSH Ministry Approved", sortOrder: 1 },
  { label: "ISO 9001:2015", sortOrder: 2 },
  { label: "USDA Organic Sourced Herbs", sortOrder: 3 },
  { label: "NABH-aligned Clinical Protocols", sortOrder: 4 },
];

const siteSettings = {
  brand: { name: "JATA Ayurveda", tagline: "Timeless Wellness, Rooted in Modern Science" },
  contact: { phone: "+91 90000 00000", email: "care@jataayurveda.com", whatsapp: "+91 90000 00000", address: "JATA Ayurveda Centre, Bengaluru, Karnataka, India", business_hours: "Mon–Sat · 9:00 AM – 7:00 PM" },
  socials: { instagram: "https://instagram.com/", facebook: "https://facebook.com/", youtube: "https://youtube.com/" },
  // Shipping is currently disabled/free. Keep the future pricing values here
  // so shipping can be enabled later without changing checkout logic.
  commerce: { currency: "INR", shipping_enabled: false, free_shipping_over_paise: 99900, flat_shipping_paise: 7900, gst_percent: 0 },
  footer: { copyright: "© JATA Ayurveda. All rights reserved.", note: "JATAS Ayurvedic Healthcare Systems LLP" },
};

async function upsertMany(Model, docs, key) {
  for (const doc of docs) await Model.findOneAndUpdate({ [key]: doc[key] }, doc, { upsert: true, new: true, setDefaultsOnInsert: true });
  console.log(`[seed] ${Model.modelName}: ${docs.length} upserted`);
}

async function run() {
  await connectDB();
  await upsertMany(ProductCategory, categories, "slug");
  const cats = await ProductCategory.find({});
  const catBySlug = new Map(cats.map((c) => [c.slug, c._id]));
  const productDocs = products.map(({ categorySlug, ...p }) => ({ ...p, category: catBySlug.get(categorySlug) ?? null, status: "published" }));
  await upsertMany(Product, productDocs, "slug");
  await upsertMany(Service, services.map((s) => ({ ...s, status: "published" })), "slug");
  await upsertMany(Doctor, doctors, "name");
  await upsertMany(Testimonial, testimonials, "name");
  await upsertMany(BlogPost, blogPosts, "slug");
  await upsertMany(ResearchItem, research, "title");
  await upsertMany(Certification, certifications, "label");
  await upsertMany(Coupon, [{ code: "WELCOME10", description: "10% off first order", discountType: "percent", discountValue: 10, minOrderPaise: 0, isActive: true }], "code");

  for (const [key, value] of Object.entries(siteSettings)) await SiteSetting.findOneAndUpdate({ key }, { key, value }, { upsert: true });
  console.log(`[seed] SiteSetting: ${Object.keys(siteSettings).length} upserted`);

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const existing = await User.findOne({ email: adminEmail.toLowerCase() });
    if (!existing) {
      const passwordHash = await User.hashPassword(adminPassword);
      await User.create({ name: "Admin", email: adminEmail.toLowerCase(), passwordHash, roles: ["admin"] });
      console.log(`[seed] Created initial admin user: ${adminEmail}`);
    } else console.log(`[seed] Admin user ${adminEmail} already exists — skipped`);
  } else console.log("[seed] SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — no admin user created. Set them in .env and re-run.");
  console.log("[seed] Done.");
  process.exit(0);
}

run().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
  });
