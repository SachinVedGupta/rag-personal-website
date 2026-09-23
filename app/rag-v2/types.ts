export interface MediaItem {
  type: "image" | "video" | "link" | "document";
  url: string;
  label: string;
  alt?: string;
  caption?: string;
}

export interface CorpusPoint {
  id: string;
  title: string;
  category: string;
  text: string;
  source: string;
  sourceUrl: string;
  entities: string[];
  themes: string[];
  relatedIds: string[];
  media: MediaItem[];
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
  text: string;
  snippet: string;
  entities: string[];
  themes: string[];
  relatedIds: string[];
  media: MediaItem[];
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
  resolvedQuestion: string;
  contextUsed: boolean;
  answer: string;
  models: {
    planner: string;
    answer: string;
    embedding: string;
  };
  complimentaryBudget: {
    date: string;
    fullUsed: number;
    fullLimit: number;
    miniUsed: number;
    miniLimit: number;
  };
  retrieval: {
    scope: "focused" | "synthesis";
    searchCount: number;
    maxSearches: number;
    queries: QueryTrace[];
    evidence: EvidenceHit[];
  };
  visualization: VisualizationData;
  message?: string;
}
