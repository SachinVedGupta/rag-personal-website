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

OpenAI-hosted tools are not used. The retrieval loop runs in this service, which
keeps eligible model traffic within the complimentary-token offer described in
OpenAI's data-sharing documentation.

## Local setup

Copy `.env.example` to the ignored `.env` and fill the v2 variables. Then run:

```bash
ai/.venv/bin/python -m ai.v2.ingest
ai/.venv/bin/python -m ai.v2.app
npm run dev -- -p 3001
```

Open `http://localhost:3001/rag-v2`. The original page and backend routes remain
available separately.
