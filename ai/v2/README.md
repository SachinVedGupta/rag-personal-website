# RAG v2

RAG v2 runs beside the original Flask/LangChain service. It uses a separate
Pinecone index and namespace, so indexing or testing v2 does not modify the
original `webrag` vectors.

## Data flow

1. `corpus/public_profile.json` stores reviewed, public-safe knowledge records.
2. `ingest.py` embeds each record with `all-MiniLM-L6-v2`, replaces only the v2
   namespace, and writes a fixed PCA projection.
3. `agent.py` asks GPT-5.4 Mini for a small semantic search plan, queries
   Pinecone, checks evidence coverage, and may run one follow-up batch.
4. GPT-5.4 writes the grounded answer. GPT-5.4 Mini is the fallback.
5. The response includes every planned query and its hits so the frontend can
   overlay them on the same PCA map without another retrieval call.
6. The curated profile is the answer authority. Public answers state its facts
   directly in Sachin's voice, while still refusing to invent absent details.
7. Records can carry images, demos, documents, and project links. Media metadata
   is stored with each Pinecone record and returned only when relevant.

The retrieval map exposes the complete indexed text, similarity scores, entities,
themes, relationships, sources, media, and fixed PCA coordinates. The 384-value
MiniLM embeddings remain in Pinecone; the browser receives their stable 2D PCA
projection rather than a large raw vector payload.

OpenAI-hosted tools are not used. The retrieval loop runs in this service, which
keeps eligible model traffic within the complimentary-token offer described in
OpenAI's data-sharing documentation.

The service also keeps a local UTC-day token ledger. It switches final answers
to Mini at 200K locally observed full-model tokens and stops at 2M Mini tokens,
leaving a buffer below the Tier 1-2 complimentary limits. The OpenAI quota is
account-wide, so usage by other projects must still be monitored in the Platform
Usage dashboard.

## Local setup

Copy `.env.example` to the ignored `.env` and fill the v2 variables. Then run:

```bash
ai/.venv/bin/python -m ai.v2.ingest
ai/.venv/bin/python -m ai.v2.app
npm run dev -- -p 3001
```

Open `http://localhost:3001/rag-v2`. The original page and backend routes remain
available separately.
