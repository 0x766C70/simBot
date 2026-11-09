import { NextRequest, NextResponse } from "next/server";
import { runSimbot, type ChatMessage } from "@/lib/agent";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "MISTRAL_API_KEY absente côté serveur." },
      { status: 500 }
    );
  }

  let history: ChatMessage[];
  try {
    const body = await request.json();
    history = body.messages;
    if (
      !Array.isArray(history) ||
      history.length === 0 ||
      history.some(
        (m) =>
          typeof m?.content !== "string" ||
          !["user", "assistant"].includes(m?.role)
      )
    ) {
      throw new Error("format invalide");
    }
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  try {
    const answer = await runSimbot(history, apiKey);
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("simbot error:", err);
    return NextResponse.json(
      { error: "Erreur interne de l'agent." },
      { status: 502 }
    );
  }
}
