import Mistral from "@mistralai/mistralai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export const SIMVITO_MCP_URL = "https://mcp.simvito.com/mcp?src=mcpso";

export const SYSTEM_PROMPT = `Tu es simBot, un assistant strictement spécialisé dans le mobile :
eSIM, forfaits data voyage, roaming, opérateurs mobiles, réseaux 4G/5G,
compatibilité des téléphones, déblocage d'appareils, etc.

Règles :
- Si la question de l'utilisateur ne concerne PAS le mobile, refuse poliment
  en une phrase et rappelle que tu ne réponds que sur les sujets mobiles.
  N'utilise aucun outil dans ce cas.
- Pour toute question sur les eSIM, forfaits, réseaux ou destinations,
  sers-toi des outils MCP Simvito fournis. Réponds en français.`;

const MAX_STEPS = 6;

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

/**
 * Boucle agent : Mistral + outils du MCP Simvito (function calling).
 * `history` ne contient que les messages user/assistant ; le prompt
 * système est injecté ici, côté serveur.
 */
export async function runSimbot(
  history: ChatMessage[],
  apiKey: string
): Promise<string> {
  const mcp = new Client({ name: "simbot-web", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(SIMVITO_MCP_URL));
  const mistral = new Mistral({ apiKey });

  try {
    await mcp.connect(transport);
    const { tools: mcpTools } = await mcp.listTools();

    const tools = mcpTools.map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description ?? "",
        parameters: t.inputSchema,
      },
    }));

    const messages: Array<Record<string, unknown>> = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    for (let step = 0; step < MAX_STEPS; step++) {
      const response = await mistral.chat.complete({
        model: "mistral-small-latest",
        messages,
        tools: tools.length > 0 ? tools : undefined,
      });

      const choice = response.choices?.[0];
      if (!choice) throw new Error("Réponse Mistral vide");

      const message = choice.message as {
        role: string;
        content?: string | null;
        toolCalls?: Array<{
          id: string;
          function: { name: string; arguments: string | object };
        }>;
      };

      if (!message.toolCalls || message.toolCalls.length === 0) {
        return message.content ?? "";
      }

      messages.push(message);
      for (const call of message.toolCalls) {
        const args =
          typeof call.function.arguments === "string"
            ? JSON.parse(call.function.arguments || "{}")
            : call.function.arguments;
        let resultText: string;
        try {
          const result = await mcp.callTool({ name: call.function.name, arguments: args });
          const content = result.content as Array<{ type: string; text?: string }>;
          resultText = content
            ?.filter((c) => c.type === "text")
            .map((c) => c.text)
            .join("\n") ?? JSON.stringify(result);
        } catch (err) {
          resultText = `Erreur de l'outil ${call.function.name} : ${String(err)}`;
        }
        messages.push({
          role: "tool",
          toolCallId: call.id,
          content: resultText,
        });
      }
    }

    return "Désolé, je n'ai pas pu finaliser la réponse (trop d'étapes).";
  } finally {
    await mcp.close().catch(() => {});
  }
}
