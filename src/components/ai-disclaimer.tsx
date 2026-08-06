import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiDisclaimer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border border-border bg-surface-subtle px-4 py-3 text-xs leading-relaxed text-muted-foreground",
        className,
      )}
    >
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
      <p>
        <span className="font-semibold text-foreground">Responsible AI:</span> outputs are generated
        by an AI model and can be incomplete or wrong. Review and edit everything before sharing it,
        never paste confidential or personal data, and keep a human decision-maker accountable for
        legal, financial, HR and safety matters.
      </p>
    </div>
  );
}