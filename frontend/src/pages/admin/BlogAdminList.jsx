import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { listBlogAdmin, deleteBlogPost } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

export default function BlogAdminList() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: () => listBlogAdmin({ limit: 100 }),
  });
  const posts = data ?? [];

  const delMut = useMutation({
    mutationFn: (id) => deleteBlogPost(id),
    onSuccess: () => {
      toast.success("Post deleted");
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Blog</h1>
          <p className="text-sm text-muted-foreground">Health journal articles shown on the public site.</p>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/admin/blog/new">
            <Plus className="h-4 w-4" /> New post
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Post</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Published</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!isLoading && posts.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No blog posts yet.</td></tr>
            )}
            {posts.map((p) => (
              <tr key={p._id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="h-10 w-10 rounded-md object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted" />
                    )}
                    <div>
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-muted-foreground">/{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={p.status === "published" ? "default" : "secondary"}>{p.status}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.publishedAt ? formatDate(p.publishedAt) : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon">
                      <Link to={`/admin/blog/${p._id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Delete "${p.title}"?`)) delMut.mutate(p._id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
