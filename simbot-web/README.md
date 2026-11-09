# simBot-web

Front-end de chat pour simBot, déployable directement sur Vercel.

- **UI** : page de chat (Next.js App Router, React).
- **API** : `app/api/chat/route.ts` — boucle agent Mistral (`mistral-small-latest`)
  interconnectée au MCP Simvito eSIM (`https://mcp.simvito.com/mcp?src=mcpso`).
- **Périmètre** mobile uniquement (eSIM, forfaits, roaming, 4G/5G), garanti par le
  prompt système côté serveur.

## Développement local

```bash
npm install
cp .env.local.example .env.local   # ou créez .env.local avec MISTRAL_API_KEY=...
npm run dev
```

## Déploiement sur Vercel

1. Pousser ce dossier sur un dépôt Git, ou installer le CLI : `npm i -g vercel`
2. Depuis ce dossier :

```bash
vercel        # prévisualisation
vercel --prod # production
```

3. Dans le dashboard Vercel : **Settings → Environment Variables**, ajoutez
   `MISTRAL_API_KEY=mstrl_...` (ne jamais exposer cette clé côté client).
