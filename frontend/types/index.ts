export type DataValue = number | string;
export type DataType = "number" | "text";
export type Domain = "sorting" | "searching" | "graph";
export type View =
  | "dashboard"
  | "selector"
  | "complexity"
  | "benchmark"
  | "graph"
  | "explainability"
  | "history";
export type Edge = { source: string; target: string; weight: number };
export interface Input {
  data: DataValue[];
  queries: DataValue[];
  updates: number;
  allow_preprocessing: boolean;
  memory: "balanced" | "limited";
  stable: boolean;
  nodes: string[];
  edges: Edge[];
  directed: boolean;
  task: "traversal" | "single-source" | "all-pairs";
  source: string;
  trials: number;
}
export interface Metadata {
  name: string;
  domain: Domain;
  best: string;
  average: string;
  worst: string;
  space: string;
  stable: boolean | null;
  inplace: boolean;
  notes: string;
  recurrence: string;
  comparison_based: boolean;
}
export interface Profile {
  n: number;
  minimum?: DataValue | null;
  maximum?: DataValue | null;
  range?: number | null;
  data_type?: DataType;
  max_length?: number | null;
  average_length?: number | null;
  ordering?: string;
  unique?: number;
  duplicate_ratio?: number;
  sortedness?: number;
  reverse_sortedness?: number;
  inversions?: number;
  disorder?: number;
  histogram?: number[];
  sample?: DataValue[];
  vertices?: number;
  edges?: number;
  density?: number;
  negative_edges?: number;
  weighted?: boolean;
  directed?: boolean;
  task?: string;
}
export type ComponentKey = "complexity" | "fit" | "memory" | "history";
export interface Candidate {
  id: string;
  name: string;
  eligible: boolean;
  reasons: string[];
  exclusions: string[];
  estimated_work: number;
  components: Record<ComponentKey, number>;
  history_samples: number;
  metadata: Metadata;
  score: number;
}
export interface Selection {
  benchmark_conditions?: Job["conditions"];
  domain: Domain;
  profile: Profile;
  candidates: Candidate[];
  recommended: string;
  weights: Record<ComponentKey, number>;
  similar_experiments: number;
  note: string;
}
export interface GraphOutput {
  order?: string[];
  distances?: Record<string, number | null>;
  parents?: Record<string, string>;
  negative_cycle?: boolean;
  all_pairs?: Record<string, Record<string, number | null>>;
}
export interface Result {
  algorithm: string;
  status: string;
  runtime_ms?: number;
  trials_ms?: number[];
  correct?: boolean;
  peak_bytes?: number;
  metrics?: {
    comparisons: number;
    swaps: number;
    moves: number;
    visits: number;
    recursion_calls: number;
    operations: number;
  };
  output?: DataValue[] | boolean[] | GraphOutput;
  error?: string;
  n?: number;
  output_truncated?: boolean;
}
export interface Summary {
  id: string;
  selected: string;
  winner: string | null;
  performance_gap: number | null;
  matched: boolean | null;
  baseline_algorithm: string;
  baseline_ms: number | null;
  selected_ms: number | null;
}
export interface Job {
  id: string;
  kind: string;
  status: string;
  progress: number;
  current: string;
  results: Result[];
  selection?: Selection;
  summary?: Summary;
  error?: string;
  cancel_requested: boolean;
  conditions?: {
    trials: number;
    statistic: string;
    memory: string;
    operations: string;
    fairness: string;
    runtime: string;
    timeout_seconds: number;
  };
}
export interface HistoryItem {
  id: string;
  created_at: string;
  domain: Domain;
  selected: string;
  winner: string | null;
  performance_gap: number | null;
  baseline_ms: number | null;
  selected_ms: number | null;
  matched: number | null;
  profile: Profile;
}
export interface HistoryData {
  items: HistoryItem[];
  stats: {
    experiments: number;
    evaluated: number;
    accuracy: number | null;
    average_gap: number | null;
    baseline_speedup: number | null;
  };
}
