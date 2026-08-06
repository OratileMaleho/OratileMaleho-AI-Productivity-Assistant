import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, ListChecks, BookOpenText, MessagesSquare, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atlas — AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Plan tasks, research topics and draft work with AI. Structured prompts, editable outputs, built for professionals.",
      },
      { property: "og:title", content: "Atlas — AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "Plan tasks, research topics and draft work with AI — structured prompts, editable outputs.",
      },
    ],
  }),
  component: Index,
});

const features = [
  {
    icon: ListChecks,
    title: "AI Task Planner",
    body: "Turn an objective into milestones, owners, tasks and risks you can edit and export.",
  },
  {
    icon: BookOpenText,
    title: "AI Research Assistant",
    body: "Structured briefs for any topic, tuned to your audience and the depth you need.",
  },
  {
    icon: MessagesSquare,
    title: "AI Chat",
    body: "A saved conversation for drafting, summarising and thinking through your work.",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-8">
        <span className="flex min-w-0 items-center gap-2 font-display text-lg font-bold">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg brand-gradient">
            <Bot className="size-4 text-primary-foreground" />
          </span>
          Atlas
        </span>
        <Link
          to="/auth"
          className="inline-flex shrink-0 items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-8">
        <section className="py-14 sm:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            AI workplace productivity
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.08] sm:text-6xl">
            Automate the busywork.{" "}
            <span className="text-brand-gradient">Keep the judgement.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Atlas plans your projects, researches your topics and drafts your messages — with
            structured prompts and outputs you stay in control of.
          </p>
          <div className="mt-8">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-xl brand-gradient px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-float)]"
            >
              Get started free <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="surface-card p-6">
              <div className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <feature.icon className="size-5" />
              </div>
              <h2 className="mt-4 text-base font-semibold">{feature.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </section>

        <p className="mt-10 text-xs text-muted-foreground">
          Responsible AI: Atlas can be wrong. Review AI output and verify facts before acting on
          them, and avoid sharing confidential data you are not permitted to process.
        </p>
      </main>
    </div>
  );
}
