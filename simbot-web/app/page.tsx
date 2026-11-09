"use client";

import { useRef, useState } from "react";

type DisplayMessage = {
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
};

const SUGGESTIONS = [
  "Quels forfaits eSIM pour le Japon, 7 jours ?",
  "Mon iPhone 13 est-il compatible eSIM ?",
  "Quel réseau est le meilleur en Thaïlande ?",
];

export default function Chat() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  };

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;

    const history = messages
      .filter((m) => !m.pending)
      .map(({ role, content }) => ({ role, content }));
    history.push({ role: "user", content: question });

    setMessages((prev) => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: "…", pending: true },
    ]);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: data.answer },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: `Erreur : ${err instanceof Error ? err.message : "inconnue"}`,
        },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  return (
    <main className="chat-container">
      <header className="chat-header">
        <h1>simBot</h1>
        <p>
          Assistant exclusivement mobile : eSIM, forfaits data voyage,
          roaming, réseaux 4G/5G.
        </p>
      </header>

      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 &&
          SUGGESTIONS.map((s) => (
            <button
              key={s}
              className="bubble bot"
              style={{
                cursor: "pointer",
                background: "transparent",
                border: "1px dashed #2c3242",
                color: "var(--accent)",
                textAlign: "left",
                font: "inherit",
              }}
              onClick={() => send(s)}
            >
              {s}
            </button>
          ))}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`bubble ${m.role === "user" ? "user" : "bot"} ${
              m.pending ? "thinking" : ""
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>

      <form
        className="chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Posez une question mobile (eSIM, forfaits, roaming…)"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Envoyer
        </button>
      </form>
    </main>
  );
}
