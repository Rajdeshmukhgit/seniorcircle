"use client";

import { ArrowUp, FileText, MessageCircle, Mic, RotateCcw, Square, Volume2, VolumeX, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { SITE_NAME } from "@/lib/constants/site";
import { CHAT_LIMITS, type ChatEvent, type ChatSource } from "@/lib/chat/types";
import { useSpeech } from "@/lib/hooks/useSpeech";
import { cn } from "@/lib/utils";
import { ChatText } from "./ChatText";

interface Turn {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  /** Shown under a reply when something went wrong part-way. */
  note?: string;
}

const SUGGESTIONS = [
  "What should I prepare for a Barclays interview?",
  "How did people prepare for GATE alongside college?",
  "Tips for a first internship interview",
  "How do connect requests work here?",
];

const STORAGE_KEY = "assistant-chat";

function loadTurns(): Turn[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(saved) ? (saved as Turn[]).filter((turn) => turn.content) : [];
  } catch {
    return [];
  }
}

export function ChatWidget({ firstName, modelReady }: { firstName: string; modelReady: boolean }) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  /** The message currently being read aloud, if any. */
  const [speakingId, setSpeakingId] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nextId = useRef(1);

  // Voice uses the browser's own speech services, so it needs no API key.
  // These refs let the speech hook call back into the chat without either one
  // having to be defined before the other.
  const askRef = useRef<(text: string, spoken?: boolean) => void>(() => {});
  const listenRef = useRef<() => void>(() => {});

  const {
    canListen,
    canSpeak,
    listening,
    speaking,
    interim,
    error: micError,
    startListening,
    stopListening,
    startReply,
    speakReply,
    speakMessage,
    cancelSpeech,
  } = useSpeech({
    onQuestion: (text) => askRef.current(text, true),
    // Talking over a spoken reply stops it and starts a new question.
    onBargeIn: () => listenRef.current(),
  });

  useEffect(() => {
    listenRef.current = startListening;
  });

  // The Listen and Stop labels follow whatever is actually being spoken. While
  // a reply is still streaming the voice falls silent between sentences, so
  // the label only resets once the answer is finished too.
  useEffect(() => {
    if (!speaking && !busy) setSpeakingId(null);
  }, [speaking, busy]);

  // Closing the panel releases the microphone and silences the voice.
  useEffect(() => {
    if (open) return;
    stopListening();
    cancelSpeech();
  }, [open, stopListening, cancelSpeech]);

  // The conversation survives page reloads for this browser tab only.
  useEffect(() => {
    const saved = loadTurns();
    if (saved.length > 0) {
      nextId.current = Math.max(...saved.map((turn) => turn.id)) + 1;
      setTurns(saved);
    }
  }, []);

  useEffect(() => {
    if (busy) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(turns.slice(-CHAT_LIMITS.historyMessages)));
    } catch {
      // Storage can be unavailable in private windows. The chat still works.
    }
  }, [turns, busy]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [turns, open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const ask = useCallback(
    async (text: string, spoken = false) => {
      const question = text.trim();
      if (!question || busy) return;

      const userTurn: Turn = { id: nextId.current++, role: "user", content: question };
      const replyId = nextId.current++;
      const history = [...turns, userTurn];
      // A question asked out loud is answered out loud.
      const readAloud = spoken && canSpeak;

      setTurns([...history, { id: replyId, role: "assistant", content: "" }]);
      setDraft("");
      setError("");
      setBusy(true);
      if (readAloud) {
        startReply();
        setSpeakingId(replyId);
      }

      const patch = (change: (turn: Turn) => Turn) =>
        setTurns((current) => current.map((turn) => (turn.id === replyId ? change(turn) : turn)));

      const abort = new AbortController();
      abortRef.current = abort;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          signal: abort.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history
              .slice(-CHAT_LIMITS.historyMessages)
              .map(({ role, content }) => ({ role, content: content.slice(0, 4000) })),
          }),
        });

        if (!response.ok || !response.body) {
          const data = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(data?.message ?? "The assistant could not answer. Please try again.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // Kept alongside the rendered turn so complete sentences can be spoken
        // as they arrive, the way the voice agent this is adapted from does.
        let answer = "";

        const handle = (line: string) => {
          if (!line.trim()) return;
          const event = JSON.parse(line) as ChatEvent;
          if (event.type === "sources") {
            patch((turn) => ({ ...turn, sources: event.sources }));
          } else if (event.type === "token") {
            answer += event.text;
            patch((turn) => ({ ...turn, content: turn.content + event.text }));
            if (readAloud) speakReply(answer);
          } else if (event.type === "error") {
            patch((turn) => ({ ...turn, note: event.message }));
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          lines.forEach(handle);
        }
        handle(buffer);
        if (readAloud) speakReply(answer, true);
      } catch (cause) {
        if (abort.signal.aborted) {
          cancelSpeech();
          patch((turn) => ({ ...turn, note: "Stopped." }));
        } else {
          setError(cause instanceof Error ? cause.message : "The assistant could not answer. Please try again.");
        }
      } finally {
        // Drop the reply bubble if nothing at all arrived.
        setTurns((current) => current.filter((turn) => turn.id !== replyId || turn.content || turn.note));
        abortRef.current = null;
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [busy, turns, canSpeak, startReply, speakReply, cancelSpeech],
  );

  useEffect(() => {
    askRef.current = (text, spoken) => void ask(text, spoken);
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void ask(draft);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void ask(draft);
    }
  };

  const clear = () => {
    abortRef.current?.abort();
    cancelSpeech();
    setTurns([]);
    setError("");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clear.
    }
  };

  return (
    <>
      {open && (
        <section
          role="dialog"
          aria-label={`${SITE_NAME} assistant`}
          className="fixed inset-x-3 bottom-3 top-20 z-50 flex flex-col overflow-hidden rounded-card border border-line bg-card shadow-float [--cut:30px] sm:inset-x-auto sm:bottom-24 sm:right-6 sm:top-auto sm:h-[min(600px,calc(100vh-8.5rem))] sm:w-[390px]"
        >
          <header className="panel-gradient flex items-center gap-3 px-4 py-3.5 text-white">
            <span className="glass-on-panel shape-cut flex h-9 w-9 shrink-0 items-center justify-center text-white [--cut:9px] [--r:10px]">
              <MessageCircle className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[15px] font-semibold leading-tight tracking-[-0.02em] text-white">
                Ask {SITE_NAME}
              </h2>
              <p className="truncate text-[12px] leading-tight text-white/80">Answers from seniors&apos; experiences</p>
            </div>
            {turns.length > 0 && (
              <button
                suppressHydrationWarning
                type="button"
                onClick={clear}
                aria-label="Start a new chat"
                title="Start a new chat"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
              </button>
            )}
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <X className="h-[18px] w-[18px]" aria-hidden />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
            {turns.length === 0 ? (
              <div>
                <p className="font-display text-[21px] font-semibold leading-snug tracking-[-0.04em] text-ink">
                  Hi {firstName}, what are you preparing for?
                </p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-soft">
                  Ask about a company, an exam or how the site works. Answers draw on the experiences members have
                  shared and link to them.
                </p>
                {!modelReady && (
                  <p className="mt-3 rounded-xl border border-line bg-muted px-3 py-2 text-[12.5px] leading-snug text-soft">
                    The AI model is not set up yet, so replies list matching experiences only. Add GROQ_API_KEY to
                    .env.local to turn on full answers.
                  </p>
                )}
                <ul className="mt-4 space-y-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <li key={suggestion}>
                      <button
                        suppressHydrationWarning
                        type="button"
                        onClick={() => void ask(suggestion)}
                        className="shape-cut w-full border border-line bg-chip px-3 py-2 [--cut:10px] [--r:11px] hover:-translate-y-px text-left text-[13.5px] font-medium leading-snug text-strong transition hover:border-faint hover:text-ink"
                      >
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              turns.map((turn, index) => {
                const waiting = busy && index === turns.length - 1 && turn.role === "assistant" && !turn.content;
                return turn.role === "user" ? (
                  <div key={turn.id} className="flex justify-end">
                    <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md button-gradient px-3.5 py-2 text-[14px] leading-relaxed text-white">
                      {turn.content}
                    </p>
                  </div>
                ) : (
                  <div key={turn.id} className="max-w-[92%]">
                    <div className="rounded-2xl rounded-bl-md border border-line bg-muted px-3.5 py-2.5 text-[14px] leading-relaxed text-strong">
                      {waiting ? (
                        <span className="flex items-center gap-1 py-1.5" aria-label="Thinking">
                          {[0, 1, 2].map((dot) => (
                            <span
                              key={dot}
                              className="h-1.5 w-1.5 animate-bounce rounded-full bg-faint"
                              style={{ animationDelay: `${dot * 120}ms` }}
                            />
                          ))}
                        </span>
                      ) : (
                        <ChatText text={turn.content} />
                      )}
                    </div>
                    {canSpeak && turn.content && !waiting && (
                      <button
                        suppressHydrationWarning
                        type="button"
                        onClick={() => {
                          if (speakingId === turn.id) {
                            cancelSpeech();
                          } else {
                            setSpeakingId(turn.id);
                            speakMessage(turn.content);
                          }
                        }}
                        className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[12px] font-semibold text-faint transition hover:bg-tint hover:text-ink"
                      >
                        {speakingId === turn.id ? (
                          <>
                            <VolumeX className="h-3.5 w-3.5" aria-hidden /> Stop
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3.5 w-3.5" aria-hidden /> Listen
                          </>
                        )}
                      </button>
                    )}
                    {turn.note && <p className="mt-1 px-1 text-[12px] text-faint">{turn.note}</p>}
                    {turn.sources && turn.sources.length > 0 && !waiting && (
                      <ul className="mt-2 space-y-1.5">
                        {turn.sources.map((source) => (
                          <li key={source.id}>
                            <Link
                              href={`/experiences/${source.id}`}
                              className="flex items-start gap-2 rounded-xl border border-line bg-card px-2.5 py-2 transition hover:border-faint"
                            >
                              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-text" aria-hidden />
                              <span className="min-w-0">
                                <span className="block truncate text-[12.5px] font-semibold leading-snug text-ink">
                                  {source.title}
                                </span>
                                <span className="block truncate text-[11.5px] leading-snug text-faint">
                                  {source.author}, batch of {source.year}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={onSubmit} className="border-t border-line px-3 pb-2.5 pt-3">
            {(error || micError) && (
              <p role="alert" className="mb-2 px-1 text-[12.5px] leading-snug text-danger">
                {error || micError}
              </p>
            )}
            <div className="flex items-end gap-2">
              {canListen && (
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => (listening ? stopListening() : startListening())}
                  aria-label={listening ? "Stop listening" : "Ask by voice"}
                  title={listening ? "Stop listening" : "Ask by voice"}
                  className={cn(
                    "flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border transition active:scale-95",
                    listening
                      ? "animate-pulse border-danger bg-danger/10 text-danger"
                      : "border-line bg-card text-soft hover:border-faint hover:text-ink",
                  )}
                >
                  <Mic className="h-[18px] w-[18px]" aria-hidden />
                </button>
              )}
              <label htmlFor="assistant-input" className="sr-only">
                Ask the assistant
              </label>
              <textarea
                suppressHydrationWarning
                id="assistant-input"
                ref={inputRef}
                value={listening ? interim : draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onKeyDown}
                readOnly={listening}
                rows={1}
                maxLength={CHAT_LIMITS.messageLength}
                placeholder={listening ? "Listening…" : "Ask about a company or exam"}
                className="field-input max-h-28 min-h-[42px] flex-1 resize-none py-2.5"
              />
              {busy ? (
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => abortRef.current?.abort()}
                  aria-label="Stop answering"
                  title="Stop"
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-line bg-card text-ink transition hover:border-faint active:scale-95"
                >
                  <Square className="h-3.5 w-3.5 fill-current" aria-hidden />
                </button>
              ) : (
                <button
                  suppressHydrationWarning
                  type="submit"
                  disabled={!draft.trim()}
                  aria-label="Send"
                  className="button-gradient shape-cut flex h-[42px] w-[42px] shrink-0 items-center justify-center text-white transition [--cut:11px] [--r:11px] active:scale-95 disabled:opacity-40"
                >
                  <ArrowUp className="h-[18px] w-[18px]" aria-hidden />
                </button>
              )}
            </div>
            <p className="mt-2 px-1 text-[11px] leading-snug text-faint">
              AI answers can be wrong. Open the linked experiences to check.
            </p>
          </form>
        </section>
      )}

      <button
        suppressHydrationWarning
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close assistant" : `Ask ${SITE_NAME}`}
        className={cn(
          "button-gradient shape-cut fixed bottom-5 right-5 z-50 h-[52px] items-center gap-2 px-5 font-display text-[14.5px] font-semibold text-white shadow-[0_14px_34px_-12px_rgba(10,118,240,0.75)] transition [--cut:14px] [--r:16px] hover:-translate-y-0.5 active:scale-95 sm:right-6",
          open ? "hidden sm:flex" : "flex",
        )}
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <MessageCircle className="h-5 w-5" aria-hidden />}
        <span className={cn(open && "sr-only")}>{open ? "Close" : "Ask"}</span>
      </button>
    </>
  );
}
