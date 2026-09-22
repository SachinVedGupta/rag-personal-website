export interface CorpusPoint {
  id: string;
  title: string;
  category: string;
  x: number;
  y: number;
}

export interface EvidenceHit {
  id: string;
  score: number;
  title: string;
  category: string;
  source: string;
  sourceUrl: string;
  confidence: string;
  snippet: string;
}

export interface QueryTrace {
  id: string;
  label: string;
  query: string;
  rationale: string;
  point: [number, number];
  hitIds: string[];
  hits: EvidenceHit[];
}

export interface VisualizationData {
  method: "PCA";
  projectionVersion: string;
  points: CorpusPoint[];
  queries: QueryTrace[];
}

export interface AskResponse {
  status: "success" | "error";
  question: string;
  answer: string;
  models: {
    planner: string;
    answer: string;
    embedding: string;
  };
  retrieval: {
    searchCount: number;
    maxSearches: number;
    queries: QueryTrace[];
    evidence: EvidenceHit[];
  };
  visualization: VisualizationData;
  message?: string;
}
