import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const AI_MODEL = "google/gemini-3.6-flash";

export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable-ai-gateway",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

export function requireGatewayKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured yet.");
  return key;
}

export const ASSISTANT_SYSTEM_PROMPT = `You are Atlas, an AI workplace productivity assistant for busy professionals.
You help with planning work, researching topics, drafting communications, and summarising information.
Be concise, structured, and practical. Use markdown headings, short paragraphs and bullet lists.
When a request involves legal, financial, medical, or HR decisions, note that a qualified human should review the output.
Never invent facts, statistics, citations, or internal company data. Say clearly when you are uncertain.`;