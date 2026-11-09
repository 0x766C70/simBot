"""Test rapide de simBot : connexion MCP + deux questions (mobile et hors-sujet)."""

import asyncio

from dotenv import load_dotenv

from simbot import SYSTEM_PROMPT, build_agent

QUESTIONS = [
    "Quels forfaits eSIM pour le Japon, 7 jours ?",
    "Quelle est la capitale du Brésil ?",
]


async def run():
    load_dotenv()
    client, llm = build_agent()
    tools = await client.get_tools()
    print("Outils MCP :", [t.name for t in tools])

    from langchain.agents import create_agent

    agent = create_agent(llm, tools, system_prompt=SYSTEM_PROMPT)
    for q in QUESTIONS:
        result = await agent.ainvoke({"messages": [("user", q)]})
        print("\n--- Question :", q)
        print("Réponse :", result["messages"][-1].content[:500])


asyncio.run(run())
