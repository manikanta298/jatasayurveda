const mongoose = require("mongoose");

const blogPostSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    excerpt: { type: String, default: "" },
    content: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    // Optional short video (e.g. a clip or product demo) attached to the
    // post. When set, the blog detail page shows the cover image as a
    // clickable banner that swaps in this video and autoplays on click.
    videoUrl: { type: String, default: "" },
    // Per-post social links (e.g. the YouTube video this article is based
    // on, or a related Instagram post) — separate from the site-wide
    // `socials` setting used in the footer. Same shape so the frontend
    // <SocialLinks> component can render either.
    socialLinks: {
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      youtube: { type: String, default: "" },
      twitter: { type: String, default: "" },
      linkedin: { type: String, default: "" },
    },
    author: { type: String, default: "" },
    readingTime: { type: String, default: "" }, // e.g. "6 min read"
    tags: { type: [String], default: [] },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

blogPostSchema.index({ publishedAt: -1 });

module.exports = mongoose.model("BlogPost", blogPostSchema);
