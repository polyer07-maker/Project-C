"use client";

import { useRef, useState, useTransition } from "react";
import { resetConversation, sendAgentMessage } from "@/app/actions";

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  source?: string;
}

const SUGGESTIONS = [
  "Cât pot economisi realist pe lună?",
  "În cât timp scap de datorii?",
  "Unde pot tăia fără să ne chinuim?",
  "Îmi permit o vacanță de 6000 lei?",
  "Unde se duc banii noștri?",
  "De unde încep?",
];

export function AgentChat({ initialMessages }: { initialMessages: ChatMessage[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const ask = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || pending) return;

    setMessages((current) => [
      ...current,
      { id: `local-${Date.now()}`, role: "user", content: trimmed },
    ]);
    setNote(null);

    startTransition(async () => {
      const reply = await sendAgentMessage(trimmed);
      setMessages((current) => [
        ...current,
        { id: `reply-${Date.now()}`, role: "agent", content: reply.answer, source: reply.source },
      ]);
      setNote(reply.note);
    });
  };

  return (
    <div className="flex h-[640px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Agentul de buget</p>
          <p className="text-xs text-slate-500">Răspunde numai cu cifre calculate din datele tale</p>
        </div>
        <form
          action={async () => {
            await resetConversation();
            setMessages([]);
            setNote(null);
          }}
        >
          <button type="submit" className="text-xs font-medium text-slate-500 hover:text-slate-900">
            Șterge conversația
          </button>
        </form>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.length === 0 && (
          <div className="rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
            Întreabă-mă orice despre bugetul familiei. Dau răspunsuri cu cifre din datele tale, iar când datele nu îmi
            ajung ca să răspund corect, îți spun exact ce lipsește în loc să inventez.
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                message.role === "user"
                  ? "bg-brand-600 text-white"
                  : "border border-slate-200 bg-slate-50 text-slate-800"
              }`}
            >
              {message.content}
              {message.role === "agent" && message.source && (
                <p className="mt-2 text-[11px] text-slate-500">
                  {message.source === "ai-verificat"
                    ? "formulat de AI, cifre verificate față de bugetul tău"
                    : message.source === "ai-respins"
                      ? "răspunsul AI a fost respins, îți arăt varianta calculată"
                      : "calculat direct din bugetul tău"}
                </p>
              )}
            </div>
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Calculez...
            </div>
          </div>
        )}

        {note && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
            {note}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 px-5 py-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => ask(suggestion)}
              disabled={pending}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = inputRef.current?.value ?? "";
            ask(value);
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            className="input"
            placeholder="Scrie întrebarea ta..."
            maxLength={500}
            disabled={pending}
          />
          <button type="submit" className="btn-primary" disabled={pending}>
            Trimite
          </button>
        </form>
      </div>
    </div>
  );
}
