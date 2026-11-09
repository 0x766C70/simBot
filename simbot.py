"""simBot : agent Mistral branché sur le MCP Simvito eSIM.

Ne répond qu'aux sujets liés au mobile (eSIM, forfaits data, roaming,
réseaux 4G/5G, opérateurs, téléphones).
"""

import asyncio
import os

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_mistralai import ChatMistralAI

SIMVITO_MCP_URL = "https://mcp.simvito.com/mcp?src=mcpso"

SYSTEM_PROMPT = """Tu es simBot, un assistant strictement spécialisé dans le mobile :
eSIM, forfaits data voyage, roaming, opérateurs mobiles, réseaux 4G/5G,
compatibilité des téléphones, déblocage d'appareils, etc.

Règles :
- Si la question de l'utilisateur ne concerne PAS le mobile, refuse poliment
  en une phrase et rappelle que tu ne réponds que sur les sujets mobiles.
  N'utilise aucun outil dans ce cas.
- Pour toute question sur les eSIM, forfaits, réseaux ou destinations,
  sers-toi des outils MCP Simvito fournis. Réponds en français.
"""


def build_agent():
    load_dotenv()
    if not os.environ.get("MISTRAL_API_KEY"):
        raise SystemExit("MISTRAL_API_KEY manquant : vérifie le fichier .env")

    client = MultiServerMCPClient(
        {
            "simvito-esim": {
                "url": SIMVITO_MCP_URL,
                "transport": "streamable_http",
            }
        }
    )
    llm = ChatMistralAI(model="mistral-small-latest", temperature=0)
    return client, llm


async def chat():
    client, llm = build_agent()
    tools = await client.get_tools()
    print(f"Connecté au MCP Simvito ({len(tools)} outils).")

    agent = create_agent(llm, tools, system_prompt=SYSTEM_PROMPT)

    print("simBot prêt. Pose ta question mobile ('quit' pour sortir).")
    while True:
        question = input("\nVous : ").strip()
        if not question:
            continue
        if question.lower() in {"quit", "exit", "q"}:
            break

        result = await agent.ainvoke({"messages": [("user", question)]})
        answer = result["messages"][-1].content
        print(f"\nsimBot : {answer}")


def main():
    asyncio.run(chat())


if __name__ == "__main__":
    main()
