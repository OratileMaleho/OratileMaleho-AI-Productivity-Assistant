import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const idInput = z.object({ id: z.string().uuid() });

/* ---------------- Task plans ---------------- */

export const listPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("task_plans")
      .select("id, title, objective, content, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const generatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        objective: z.string().min(5).max(2000),
        timeframe: z.string().max(120).default("this week"),
        role: z.string().max(120).default("professional"),
        constraints: z.string().max(1000).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { streamText } = await import("ai");
    const { createLovableAiGatewayProvider, requireGatewayKey, AI_MODEL, ASSISTANT_SYSTEM_PROMPT } =
      await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(requireGatewayKey());

    const result = streamText({
      model: gateway(AI_MODEL),
      system: ASSISTANT_SYSTEM_PROMPT,
      prompt: `Create an actionable task plan.

ROLE: ${data.role || "professional"}
OBJECTIVE: ${data.objective}
TIMEFRAME: ${data.timeframe || "this week"}
CONSTRAINTS: ${data.constraints || "none stated"}

Return markdown with exactly these sections:
## Summary  (2 sentences)
## Milestones  (table: Milestone | Owner suggestion | Due)
## Task breakdown  (checkbox list of 6-12 tasks, each with an effort estimate)
## Risks & dependencies  (bullets)
## Suggested next action  (one sentence)`,
    });

    const content = await result.text;

    const { data: row, error } = await context.supabase
      .from("task_plans")
      .insert({
        user_id: context.userId,
        title: data.objective.slice(0, 80),
        objective: data.objective,
        content,
      })
      .select("id, title, objective, content, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ id: z.string().uuid(), title: z.string().min(1).max(200), content: z.string().max(50000) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("task_plans")
      .update({ title: data.title, content: data.content })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("task_plans").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- Research briefs ---------------- */

export const listBriefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("research_briefs")
      .select("id, topic, depth, content, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const generateBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        topic: z.string().min(3).max(500),
        audience: z.string().max(200).default("internal stakeholders"),
        depth: z.enum(["quick", "standard", "deep"]).default("standard"),
        questions: z.string().max(1500).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { streamText } = await import("ai");
    const { createLovableAiGatewayProvider, requireGatewayKey, AI_MODEL, ASSISTANT_SYSTEM_PROMPT } =
      await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(requireGatewayKey());

    const lengthHint =
      data.depth === "quick" ? "about 250 words" : data.depth === "deep" ? "about 900 words" : "about 500 words";

    const result = streamText({
      model: gateway(AI_MODEL),
      system: ASSISTANT_SYSTEM_PROMPT,
      prompt: `Write a research brief (${lengthHint}).

TOPIC: ${data.topic}
AUDIENCE: ${data.audience || "internal stakeholders"}
KEY QUESTIONS: ${data.questions || "none stated — infer the three most useful ones"}

Return markdown with exactly these sections:
## Executive summary
## Key findings  (bullets)
## Considerations & trade-offs
## Open questions to verify  (things the reader must confirm from primary sources)
## Recommended next steps

Do not fabricate statistics, quotes, or sources. Where a number would normally appear, describe what to look up instead.`,
    });

    const content = await result.text;

    const { data: row, error } = await context.supabase
      .from("research_briefs")
      .insert({ user_id: context.userId, topic: data.topic, depth: data.depth, content })
      .select("id, topic, depth, content, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ id: z.string().uuid(), topic: z.string().min(1).max(500), content: z.string().max(50000) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("research_briefs")
      .update({ topic: data.topic, content: data.content })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("research_briefs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- Chat ---------------- */

export const listChatMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("chat_messages")
      .select("id, role, parts, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id as string,
      role: row.role as "user" | "assistant",
      parts: (row.parts ?? []) as { type: "text"; text: string }[],
    }));
  });

export const clearChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [plans, briefs, messages] = await Promise.all([
      context.supabase.from("task_plans").select("id, title, created_at").order("created_at", { ascending: false }),
      context.supabase.from("research_briefs").select("id, topic, created_at").order("created_at", { ascending: false }),
      context.supabase.from("chat_messages").select("id", { count: "exact", head: true }),
    ]);
    return {
      plans: plans.data ?? [],
      briefs: briefs.data ?? [],
      messageCount: messages.count ?? 0,
    };
  });