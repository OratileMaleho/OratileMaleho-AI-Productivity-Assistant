import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Pencil, Save, Trash2, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function OutputEditor({
  title,
  content,
  subtitle,
  onSave,
  onDelete,
}: {
  title: string;
  content: string;
  subtitle?: string;
  onSave: (next: { title: string; content: string }) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftContent, setDraftContent] = useState(content);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraftTitle(title);
    setDraftContent(content);
  }, [title, content]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ title: draftTitle, content: draftContent });
      setEditing(false);
      toast.success("Saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="surface-card overflow-hidden">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border bg-surface-subtle px-5 py-4 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          {editing ? (
            <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} className="h-9" />
          ) : (
            <h3 className="truncate text-sm font-semibold">{title}</h3>
          )}
          {subtitle ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {editing ? (
            <>
              <Button size="icon-sm" variant="ghost" onClick={() => setEditing(false)} aria-label="Cancel">
                <X />
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save /> Save
              </Button>
            </>
          ) : (
            <>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Copy"
                onClick={() => {
                  void navigator.clipboard.writeText(content);
                  toast.success("Copied to clipboard");
                }}
              >
                <Copy />
              </Button>
              <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setEditing(true)}>
                <Pencil />
              </Button>
              <Button size="icon-sm" variant="ghost" aria-label="Delete" onClick={() => void onDelete()}>
                <Trash2 />
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="px-5 py-4">
        {editing ? (
          <Textarea
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            className="min-h-80 font-mono text-xs leading-relaxed"
          />
        ) : (
          <div className="prose-output text-sm leading-relaxed">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </article>
  );
}