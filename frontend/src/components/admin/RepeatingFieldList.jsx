import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

// Generic "add / edit / delete / reorder" list editor for an array of
// small structured objects (e.g. hero badges: { icon, label }, or stats:
// { value, suffix, label }). `renderItem(item, update, index)` renders the
// fields for one row; `update(patch)` merges `patch` into that row.
export function RepeatingFieldList({ items, onChange, emptyItem, renderItem, addLabel = "Add item" }) {
  function updateAt(index, patch) {
    const next = items.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function removeAt(index) {
    onChange(items.filter((_, i) => i !== index));
  }

  function move(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = items.slice();
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function add() {
    onChange([...items, { ...emptyItem }]);
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 rounded-xl border border-border bg-background p-3">
          <div className="mt-2 flex shrink-0 flex-col text-muted-foreground">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="disabled:opacity-30" aria-label="Move up">
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid flex-1 gap-2 sm:grid-cols-3">{renderItem(item, (patch) => updateAt(i, patch), i)}</div>
          <Button type="button" variant="ghost" size="icon" onClick={() => removeAt(i)} className="shrink-0 text-destructive hover:text-destructive" aria-label="Remove">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="rounded-full">
        <Plus className="mr-2 h-4 w-4" /> {addLabel}
      </Button>
    </div>
  );
}
