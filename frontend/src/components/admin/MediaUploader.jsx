import { useCallback, useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadMedia } from "@/lib/queries";

export function SingleImageUploader({ value, onChange, folder, label = "Upload image" }) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const handle = useCallback(
    async (files) => {
      const file = files?.[0];
      if (!file) return;
      setBusy(true);
      try {
        const asset = await uploadMedia(file, folder);
        onChange(asset.url);
        toast.success("Image uploaded");
      } catch (e) {
        toast.error(e.message || "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [onChange, folder]
  );

  return (
    <div className="space-y-2">
      {value ? (
        <div className="group relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-border bg-muted">
          <img src={value} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-destructive shadow"
            aria-label="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handle(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex aspect-video w-full max-w-sm cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary",
            busy && "pointer-events-none opacity-60"
          )}
        >
          {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
          <span>{busy ? "Uploading…" : label}</span>
          <span className="text-xs">Drag & drop or click</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => handle(e.target.files)} />
      {value && (
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? "Uploading…" : "Replace image"}
        </Button>
      )}
    </div>
  );
}

export function SingleVideoUploader({ value, onChange, folder, label = "Upload video" }) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const handle = useCallback(
    async (files) => {
      const file = files?.[0];
      if (!file) return;
      setBusy(true);
      try {
        const asset = await uploadMedia(file, folder);
        onChange(asset.url);
        toast.success("Video uploaded");
      } catch (e) {
        toast.error(e.message || "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [onChange, folder]
  );

  return (
    <div className="space-y-2">
      {value ? (
        <div className="group relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-border bg-muted">
          <video src={value} controls className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-destructive shadow"
            aria-label="Remove video"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handle(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex aspect-video w-full max-w-sm cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary",
            busy && "pointer-events-none opacity-60"
          )}
        >
          {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
          <span>{busy ? "Uploading…" : label}</span>
          <span className="text-xs">Drag & drop or click</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="video/*" hidden onChange={(e) => handle(e.target.files)} />
      {value && (
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? "Uploading…" : "Replace video"}
        </Button>
      )}
    </div>
  );
}

export function MultiImageUploader({ value, onChange, folder }) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const handle = useCallback(
    async (files) => {
      if (!files || files.length === 0) return;
      setBusy(true);
      const uploaded = [];
      try {
        for (const file of Array.from(files)) {
          try {
            const asset = await uploadMedia(file, folder);
            uploaded.push(asset.url);
          } catch (e) {
            toast.error(`${file.name}: ${e.message || "upload failed"}`);
          }
        }
        if (uploaded.length) {
          onChange([...value, ...uploaded]);
          toast.success(`${uploaded.length} image(s) uploaded`);
        }
      } finally {
        setBusy(false);
      }
    },
    [onChange, folder, value]
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {value.map((url, i) => (
          <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-destructive opacity-0 shadow group-hover:opacity-100"
              aria-label="Remove"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handle(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/30 text-xs text-muted-foreground hover:border-primary hover:text-primary",
            busy && "pointer-events-none opacity-60"
          )}
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          <span>{busy ? "Uploading…" : "Add images"}</span>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          handle(e.target.files);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
    </div>
  );
}


export function HeroMediaSlidesUploader({ value, onChange, folder = "home-hero" }) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const slides = Array.isArray(value) ? value : [];

  const normalizeSlide = useCallback((asset, fallbackName = "") => {
    const isVideo = String(asset?.mime || "").startsWith("video/");
    return {
      kind: isVideo ? "video" : "image",
      url: asset?.url || "",
      alt: fallbackName || asset?.filename || "",
      poster: isVideo ? asset?.thumbnail_url || "" : "",
      caption: "",
    };
  }, []);

  const handle = useCallback(
    async (files) => {
      if (!files || files.length === 0) return;
      setBusy(true);
      const uploaded = [];
      try {
        for (const file of Array.from(files)) {
          try {
            const asset = await uploadMedia(file, folder);
            uploaded.push(normalizeSlide(asset, file.name));
          } catch (e) {
            toast.error(`${file.name}: ${e.message || "upload failed"}`);
          }
        }
        if (uploaded.length) {
          onChange([...slides, ...uploaded]);
          toast.success(`${uploaded.length} media item(s) uploaded`);
        }
      } finally {
        setBusy(false);
      }
    },
    [folder, normalizeSlide, onChange, slides]
  );

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {slides.map((slide, index) => {
          const kind = slide?.kind || slide?.type || "image";
          const url = slide?.url || slide?.imageUrl || slide?.src || "";
          return (
            <div key={`${url || index}-${index}`} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                {kind === "video" ? (
                  <video
                    src={url}
                    poster={slide?.poster || ""}
                    muted
                    loop
                    playsInline
                    controls
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img src={url} alt={slide?.alt || slide?.caption || ""} className="h-full w-full object-cover" />
                )}
                <span className="absolute left-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur">
                  {kind === "video" ? "Video" : "Image"}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(slides.filter((_, i) => i !== index))}
                  className="absolute right-3 top-3 rounded-full bg-destructive/90 p-2 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remove slide"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-2 p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={slide?.alt || ""}
                    onChange={(e) =>
                      onChange(slides.map((item, i) => (i === index ? { ...item, alt: e.target.value } : item)))
                    }
                    placeholder="Optional caption / alt text"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{url}</span>
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handle(e.dataTransfer.files);
          }}
          className={cn(
            "flex min-h-[10rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-4 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary",
            busy && "pointer-events-none opacity-60"
          )}
        >
          {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
          <span className="font-medium">{busy ? "Uploading…" : "Add images or videos"}</span>
          <span className="text-xs">Drop files here or click to browse</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => {
          handle(e.target.files);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
    </div>
  );
}
