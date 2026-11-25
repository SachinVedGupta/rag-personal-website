# RAG v2

RAG v2 runs beside the original Flask/LangChain service. It uses a separate
Pinecone index and namespace, so indexing or testing v2 does not modify the
original `webrag` vectors.

## Data flow

1. `corpus/public_profile.json` stores reviewed, public-safe knowledge records.
2. `ingest.py` embeds each record with `all-MiniLM-L6-v2`, replaces only the v2
   namespace, and writes a fixed PCA projection.
3. `agent.py` asks GPT-5.4 Mini for a small semantic search plan, queries
   Pinecone using MiniLM embeddings computed in the backend, checks evidence
   coverage, and may run one follow-up batch.
4. GPT-5.4 writes the grounded answer with low reasoning effort for a faster
   response. GPT-5.4 Mini is the fallback.
5. The response includes every planned query and its hits so the frontend can
   overlay them on the same PCA map without another retrieval call.
6. The curated profile is the answer authority. Public answers state its facts
   directly in Sachin's voice, while still refusing to invent absent details.
7. Records can carry images, demos, documents, and project links. Media metadata
   is stored with each Pinecone record and returned only when relevant.
8. The browser keeps the current chat in memory and sends a bounded recent
   history with each request. The Mini planner resolves short follow-ups such as
   "yes", "that project", and "photo" before retrieval. Focused follow-ups stay on
   the named subject; synthesis questions can still search across the portfolio.

The retrieval map exposes the complete indexed text, similarity scores, entities,
themes, relationships, public media links, and fixed PCA coordinates. The 384-value
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

`PINECONE_V2_INDEX_HOST` is optional. When set, the service connects directly
to the configured index host, avoiding control-plane discovery on the first search.

The root Procfile fetches and verifies the pinned MiniLM model files before
launching Gunicorn. If the host defines a custom start command, use the root
Procfile command there too. The files can also be provisioned during the build
to avoid downloading them after a cold start. This only fetches public model
files and requires no hosted Hugging Face Inference credentials.

## Local setup

Copy `.env.example` to the ignored `.env` and fill the v2 variables. Then run:

```bash
ai/.venv/bin/python -m ai.v2.model_assets
ai/.venv/bin/python -m ai.v2.app
npm run dev -- -p 3001
```

Open `http://localhost:3001/rag-v2`. The original page and backend routes remain
available separately.

## Container deployment

Build the backend with `docker build -f Dockerfile.rag-v2 .`. The image
includes a pinned, quantized MiniLM model for the smaller deployment tier.
It loads the model from disk without a runtime download. On
Northflank, use a combined service with the repository root as the build
context, `Dockerfile.rag-v2` as the Dockerfile, and port 8080 exposed over HTTPS.
Use `/v2/health` for readiness and inject the required OpenAI and Pinecone
settings as runtime secrets. Set the Vercel server's `RAG_V2_BACKEND_URL` to the
verified origin. The Docker build does not need provider credentials.
