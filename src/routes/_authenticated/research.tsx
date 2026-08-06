import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { OutputEditor } from "@/components/output-editor";
import { deleteBrief, generateBrief, listBriefs, updateBrief } from "@/lib/workspace.functions";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — Atlas Workplace AI" },
      { name: "description", content: "Generate structured, editable research briefs for any workplace topic and audience." },
      { property: "og:title", content: "AI Research Assistant — Atlas Workplace AI" },
      { property: "og:description", content: "Generate structured, editable research briefs in seconds." },
    ],
  }),
  component: Research,
});

type Depth = "quick" | "standard" | "deep";

function Research() {
  const queryClient = useQueryClient();
  const fetchBriefs = useServerFn(listBriefs);
  const create = useServerFn(generateBrief);
  const update = useServerFn(updateBrief);
  const remove = useServerFn(deleteBrief);

  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [depth, setDepth] = useState<Depth>("standard");
  const [questions, setQuestions] = useState("");

  const { data: briefs = [] } = useQuery({ queryKey: ["briefs"], queryFn: () => fetchBriefs() });

  const generate = useMutation({
    mutationFn: () => create({ data: { topic, audience, depth, questions } }),
    onSuccess: () => {
      setTopic("");
      setQuestions("");
      toast.success("Brief created");
      void queryClient.invalidateQueries({ queryKey: ["briefs"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not generate the brief"),
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">AI Research Assistant</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Get a structured starting point — then verify the facts and edit before you circulate it.
        </p>
      </header>

      <section className="surface-card p-5 sm:p-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="How hybrid teams are measuring meeting effectiveness"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="audience">Audience</Label>
              <Input
                id="audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Executive leadership team"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="depth">Depth</Label>
              <Select value={depth} onValueChange={(value) => setDepth(value as Depth)}>
                <SelectTrigger id="depth">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">Quick scan</SelectItem>
                  <SelectItem value="standard">Standard brief</SelectItem>
                  <SelectItem value="deep">Deep dive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="questions">Key questions (optional)</Label>
            <Textarea
              id="questions"
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              placeholder="What benchmarks exist? What should we pilot first?"
              className="min-h-20"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => generate.mutate()} disabled={generate.isPending || topic.trim().length < 3}>
              {generate.isPending ? <Loader2 className="animate-spin" /> : <Sparkle />}
              {generate.isPending ? "Researching…" : "Generate brief"}
            </Button>
          </div>
        </div>
      </section>

      <AiDisclaimer />

      <section className="space-y-4">
        {briefs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No briefs yet — generate your first one above.</p>
        ) : (
          briefs.map((brief) => (
            <OutputEditor
              key={brief.id}
              title={brief.topic}
              content={brief.content}
              subtitle={`${brief.depth} · ${new Date(brief.created_at).toLocaleString()}`}
              onSave={async ({ title, content }) => {
                await update({ data: { id: brief.id, topic: title, content } });
                await queryClient.invalidateQueries({ queryKey: ["briefs"] });
              }}
              onDelete={async () => {
                await remove({ data: { id: brief.id } });
                toast.success("Brief deleted");
                await queryClient.invalidateQueries({ queryKey: ["briefs"] });
                await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
              }}
            />
          ))
        )}
      </section>
    </div>
  );
}