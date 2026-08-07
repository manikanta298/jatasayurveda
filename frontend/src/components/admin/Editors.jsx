import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function StringListEditor({ value, onChange, placeholder }) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (!v) return;
    onChange([...value, v]);
    setDraft("");
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
            {v}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive" aria-label="Remove">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder ?? "Add item and press Enter"}
        />
        <Button type="button" variant="secondary" onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Note: fields renamed from the original {q, a} to {question, answer} to match
// the backend's Faq schema (Product/Service models) directly — see MIGRATION_PLAN.md.
export function FaqEditor({ value, onChange }) {
  return (
    <div className="space-y-3">
      {value.map((item, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-start gap-2">
            <Input
              value={item.question}
              onChange={(e) => {
                const next = [...value];
                next[i] = { ...next[i], question: e.target.value };
                onChange(next);
              }}
              placeholder="Question"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => onChange(value.filter((_, j) => j !== i))}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            value={item.answer}
            onChange={(e) => {
              const next = [...value];
              next[i] = { ...next[i], answer: e.target.value };
              onChange(next);
            }}
            placeholder="Answer"
            rows={3}
          />
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={() => onChange([...value, { question: "", answer: "" }])}>
        <Plus className="h-4 w-4" /> Add FAQ
      </Button>
    </div>
  );
}

// Matches Service.treatmentProcess: { title, description, order }
export function StepsEditor({ value, onChange }) {
  return (
    <div className="space-y-3">
      {value.map((item, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-start gap-2">
            <span className="mt-2 text-xs text-muted-foreground">Step {i + 1}</span>
            <Input
              value={item.title}
              onChange={(e) => {
                const next = [...value];
                next[i] = { ...next[i], title: e.target.value };
                onChange(next);
              }}
              placeholder="Step title"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => onChange(value.filter((_, j) => j !== i))}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            value={item.description}
            onChange={(e) => {
              const next = [...value];
              next[i] = { ...next[i], description: e.target.value };
              onChange(next);
            }}
            placeholder="Description"
            rows={2}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        onClick={() => onChange([...value, { title: "", description: "", order: value.length }])}
      >
        <Plus className="h-4 w-4" /> Add step
      </Button>
    </div>
  );
}

// Matches Service.ctaButtons: { label, href, style } — "style" replaces the
// original's "variant" key to line up with the backend schema field name.
export function CtaEditor({ value, onChange }) {
  return (
    <div className="space-y-3">
      {value.map((item, i) => (
        <div key={i} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto_auto]">
          <Input
            value={item.label}
            onChange={(e) => {
              const next = [...value];
              next[i] = { ...next[i], label: e.target.value };
              onChange(next);
            }}
            placeholder="Label"
          />
          <Input
            value={item.href}
            onChange={(e) => {
              const next = [...value];
              next[i] = { ...next[i], href: e.target.value };
              onChange(next);
            }}
            placeholder="/contact or https://..."
          />
          <select
            className="rounded-md border border-input bg-background px-2 text-sm"
            value={item.style}
            onChange={(e) => {
              const next = [...value];
              next[i] = { ...next[i], style: e.target.value };
              onChange(next);
            }}
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
          </select>
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange(value.filter((_, j) => j !== i))}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={() => onChange([...value, { label: "", href: "", style: "primary" }])}>
        <Plus className="h-4 w-4" /> Add button
      </Button>
    </div>
  );
}

export function GalleryUrlEditor({ value, onChange }) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (!v) return;
    try {
      new URL(v);
    } catch {
      return;
    }
    onChange([...value, v]);
    setDraft("");
  }
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {value.map((url, i) => (
          <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-background/80 p-1 text-destructive opacity-0 group-hover:opacity-100" aria-label="Remove">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="https://... image URL"
        />
        <Button type="button" variant="secondary" onClick={add}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    </div>
  );
}
