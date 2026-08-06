import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Trash2, Bot } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { clearChat, listChatMessages } from "@/lib/workspace.functions";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "AI Chat — Atlas Workplace AI" },
      { name: "description", content: "Chat with your workplace AI assistant to draft, summarise and think through work." },
      { property: "og:title", content: "AI Chat — Atlas Workplace AI" },
      { property: "og:description", content: "Chat with your workplace AI assistant — history is saved to your account." },
    ],
  }),
  component: Assistant,
});

const suggestions = [
  "Summarise this week's priorities into a stand-up update",
  "Draft a polite follow-up email chasing a late approval",
  "Turn these meeting notes into decisions and action items",
];

function Assistant() {
  const queryClient = useQueryClient();
  const fetchMessages = useServerFn(listChatMessages);
  const clear = useServerFn(clearChat);
  const { data: history, isLoading } = useQuery({
    queryKey: ["chat-history"],
    queryFn: () => fetchMessages(),
  });

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading conversation…</div>;
  }

  return (
    <ChatWindow
      initialMessages={(history ?? []) as unknown as UIMessage[]}
      onClear={async () => {
        await clear({});
        await queryClient.invalidateQueries({ queryKey: ["chat-history"] });
        await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }}
    />
  );
}

function ChatWindow({
  initialMessages,
  onClear,
}: {
  initialMessages: UIMessage[];
  onClear: () => Promise<void>;
}) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    id: "workplace-assistant",
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      headers: async () => {
        const { data } = await supabase.auth.getSession();
        return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
      },
    }),
    onError: (error) => toast.error(error.message || "The assistant could not respond"),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy]);

  function submit(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    setInput("");
    void sendMessage({ text: value });
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-4xl flex-col gap-3 p-4 sm:p-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold sm:text-2xl">AI Chat</h1>
          <p className="truncate text-sm text-muted-foreground">Your conversation is saved to your account.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await onClear();
            setMessages([]);
            toast.success("Conversation cleared");
          }}
        >
          <Trash2 /> New conversation
        </Button>
      </header>

      <Conversation className="min-h-0 flex-1 rounded-xl border border-border bg-surface">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={
                <div className="grid size-11 place-items-center rounded-xl brand-gradient">
                  <Bot className="size-6 text-primary-foreground" />
                </div>
              }
              title="How can I help with your work?"
              description="Ask a question, or start with one of these:"
            >
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <Button key={s} variant="outline" size="sm" onClick={() => submit(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, index) =>
                    part.type === "text" ? (
                      <MessageResponse key={index}>{part.text}</MessageResponse>
                    ) : null,
                  )}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" ? <Shimmer className="px-1 text-sm">Thinking…</Shimmer> : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput
        onSubmit={(_message, event) => {
          event.preventDefault();
          submit(input);
        }}
      >
        <PromptInputTextarea
          ref={textareaRef}
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Atlas to draft, summarise or plan something…"
        />
        <PromptInputFooter className="justify-end">
          <PromptInputSubmit status={status} disabled={busy || input.trim().length === 0} />
        </PromptInputFooter>
      </PromptInput>

      <AiDisclaimer />
    </div>
  );
}