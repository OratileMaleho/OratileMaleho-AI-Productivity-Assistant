import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ListChecks, BookOpenText, MessagesSquare, ArrowRight } from "lucide-react";
import { getDashboardStats } from "@/lib/workspace.functions";
import { AiDisclaimer } from "@/components/ai-disclaimer";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Jesus Is King" },
      { name: "description", content: "Your AI workspace: plans, research briefs and assistant activity at a glance." },
      { property: "og:title", content: "Dashboard — Jesus Is King" },
      { property: "og:description", content: "Your AI workspace: plans, research briefs and assistant activity." },
    ],
  }),
  component: Dashboard,
});

const tools = [
  {
    to: "/planner",
    title: "AI Task Planner",
    body: "Turn an objective into milestones, owners and a checklist you can edit.",
    icon: ListChecks,
  },
  {
    to: "/research",
    title: "AI Research Assistant",
    body: "Draft a structured research brief for any topic, audience and depth.",
    icon: BookOpenText,
  },
  {
    to: "/assistant",
    title: "AI Chat",
    body: "Ask questions, draft messages and summarise work in a saved conversation.",
    icon: MessagesSquare,
  },
] as const;

function Dashboard() {
  const fetchStats = useServerFn(getDashboardStats);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchStats() });

  const stats = [
    { label: "Task plans", value: data?.plans.length ?? 0 },
    { label: "Research briefs", value: data?.briefs.length ?? 0 },
    { label: "Chat messages", value: data?.messageCount ?? 0 },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 p-4 sm:p-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Good to see you</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plan work, research topics and draft with AI — everything you create stays editable.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="surface-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            <p className="mt-2 font-display text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link key={tool.to} to={tool.to} className="surface-card group p-5 transition-shadow hover:shadow-[var(--shadow-float)]">
            <div className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
              <tool.icon className="size-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold">{tool.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{tool.body}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Open <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>

      {(data?.plans.length || data?.briefs.length) ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <RecentList title="Recent plans" to="/planner" items={(data?.plans ?? []).slice(0, 5).map((p) => ({ id: p.id, label: p.title }))} />
          <RecentList title="Recent briefs" to="/research" items={(data?.briefs ?? []).slice(0, 5).map((b) => ({ id: b.id, label: b.topic }))} />
        </div>
      ) : null}

      <AiDisclaimer />
    </div>
  );
}

function RecentList({
  title,
  to,
  items,
}: {
  title: string;
  to: "/planner" | "/research";
  items: { id: string; label: string }[];
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link to={to} className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>
      <ul className="mt-3 space-y-2">
        {items.length === 0 ? (
          <li className="text-sm text-muted-foreground">Nothing here yet.</li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="truncate rounded-lg bg-surface-subtle px-3 py-2 text-sm">
              {item.label}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}