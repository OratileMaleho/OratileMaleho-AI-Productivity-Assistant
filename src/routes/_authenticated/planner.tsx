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
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { OutputEditor } from "@/components/output-editor";
import { deletePlan, generatePlan, listPlans, updatePlan } from "@/lib/workspace.functions";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — Jesus Is King" },
      { name: "description", content: "Turn a work objective into milestones, owners, tasks and risks with AI — then edit the plan." },
      { property: "og:title", content: "AI Task Planner — Jesus Is King" },
      { property: "og:description", content: "Turn a work objective into an editable, structured task plan." },
    ],
  }),
  component: Planner,
});

function Planner() {
  const queryClient = useQueryClient();
  const fetchPlans = useServerFn(listPlans);
  const create = useServerFn(generatePlan);
  const update = useServerFn(updatePlan);
  const remove = useServerFn(deletePlan);

  const [objective, setObjective] = useState("");
  const [role, setRole] = useState("");
  const [timeframe, setTimeframe] = useState("this week");
  const [constraints, setConstraints] = useState("");

  const { data: plans = [] } = useQuery({ queryKey: ["plans"], queryFn: () => fetchPlans() });

  const generate = useMutation({
    mutationFn: () =>
      create({ data: { objective, role, timeframe, constraints } }),
    onSuccess: () => {
      setObjective("");
      setConstraints("");
      toast.success("Plan created");
      void queryClient.invalidateQueries({ queryKey: ["plans"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not generate the plan"),
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">AI Task Planner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe the outcome you need. Jesus Is King structures it into milestones, tasks and risks.
        </p>
      </header>

      <section className="surface-card p-5 sm:p-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="objective">Objective</Label>
            <Textarea
              id="objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Launch the Q3 customer onboarding revamp across support and product"
              className="min-h-24"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="role">Your role</Label>
              <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Product marketing lead" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timeframe">Timeframe</Label>
              <Input id="timeframe" value={timeframe} onChange={(e) => setTimeframe(e.target.value)} placeholder="6 weeks" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="constraints">Constraints</Label>
              <Input
                id="constraints"
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                placeholder="No extra budget, 2 people"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => generate.mutate()}
              disabled={generate.isPending || objective.trim().length < 5}
            >
              {generate.isPending ? <Loader2 className="animate-spin" /> : <Sparkle />}
              {generate.isPending ? "Planning…" : "Generate plan"}
            </Button>
          </div>
        </div>
      </section>

      <AiDisclaimer />

      <section className="space-y-4">
        {plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">No plans yet — generate your first one above.</p>
        ) : (
          plans.map((plan) => (
            <OutputEditor
              key={plan.id}
              title={plan.title}
              content={plan.content}
              subtitle={new Date(plan.created_at).toLocaleString()}
              onSave={async ({ title, content }) => {
                await update({ data: { id: plan.id, title, content } });
                await queryClient.invalidateQueries({ queryKey: ["plans"] });
              }}
              onDelete={async () => {
                await remove({ data: { id: plan.id } });
                toast.success("Plan deleted");
                await queryClient.invalidateQueries({ queryKey: ["plans"] });
                await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
              }}
            />
          ))
        )}
      </section>
    </div>
  );
}