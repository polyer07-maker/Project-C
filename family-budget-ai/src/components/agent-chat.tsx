"use client";

import { useRef, useState } from "react";
import { useBudget } from "@/lib/budget-store";

const SUGGESTIONS = [
  "Cât pot economisi realist pe lună?",
  "În cât timp scap de datorii?",
  "Unde pot tăia fără să ne chinuim?",
  "Îmi permit o vacanță de 6000 lei?",
  "Unde se duc banii noștri?",
  "De unde încep?",
];

export function AgentChat() {
  const { state, askAgent, clearMessages } = useBudget();
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messages = state.messages;

  const ask = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || pending) return;
    setPending(true);
    window.setTimeout(() => {
      askAgent(trimmed);
      setPending(false);
    }, 30);
  };

  return (
    <div className="flex h-[70vh] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Agentul de buget</p>
          <p className="text-xs text-slate-500">Răspunde numai cu cifre calculate din datele de pe telefon</p>
        </div>
        <button type="button" onClick={clearMessages} className="text-xs font-medium text-slate-500">
          Șterge conversația
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
            Întreabă-mă despre bugetul familiei. Dacă lipsesc date, îți spun exact ce să adaugi, nu inventez.
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                message.role === "user" ? "bg-brand-600 text-white" : "border border-slate-200 bg-slate-50 text-slate-800"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">Calculez...</div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => ask(suggestion)}
              disabled={pending}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 disabled:opacity-50"
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
          <input ref={inputRef} className="input" placeholder="Scrie întrebarea ta..." maxLength={500} disabled={pending} />
          <button type="submit" className="btn-primary" disabled={pending}>
            Trimite
          </button>
        </form>
      </div>
    </div>
  );
}
