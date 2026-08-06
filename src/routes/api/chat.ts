import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  AI_MODEL,
  ASSISTANT_SYSTEM_PROMPT,
  createLovableAiGatewayProvider,
} from "@/lib/ai-gateway.server";

function textOf(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) return new Response("Unauthorized", { status: 401 });

        const supabase = createClient(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_PUBLISHABLE_KEY"]!,
          {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { headers: { Authorization: `Bearer ${token}` } },
          },
        );

        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        const body = (await request.json()) as { messages?: UIMessage[] };
        const messages = body.messages;
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("AI is not configured", { status: 500 });

        const last = messages[messages.length - 1]!;
        if (last.role === "user") {
          const { error } = await supabase.from("chat_messages").insert({
            user_id: userId,
            client_message_id: last.id,
            role: "user",
            parts: [{ type: "text", text: textOf(last) }],
          });
          if (error) console.error("Failed to save user message", error.message);
        }

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway(AI_MODEL),
          system: ASSISTANT_SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ responseMessage }) => {
            const text = textOf(responseMessage);
            if (!text) return;
            const { error } = await supabase.from("chat_messages").insert({
              user_id: userId,
              client_message_id: responseMessage.id,
              role: "assistant",
              parts: [{ type: "text", text }],
            });
            if (error) console.error("Failed to save assistant message", error.message);
          },
        });
      },
    },
  },
});