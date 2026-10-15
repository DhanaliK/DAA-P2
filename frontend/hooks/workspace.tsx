"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { parseInputData } from "@/lib/parse-data";
import { api, ApiError } from "@/lib/api";
import type {
  DataType,
  Domain,
  Input,
  Selection,
  Job,
  HistoryData,
} from "@/types";
export const initialInput: Input = {
  data: [],
  queries: [],
  updates: 0,
  allow_preprocessing: false,
  memory: "balanced",
  stable: false,
  nodes: [],
  edges: [],
  directed: true,
  task: "single-source",
  source: "A",
  trials: 3,
};
const emptyHistory: HistoryData = {
  items: [],
  stats: {
    experiments: 0,
    evaluated: 0,
    accuracy: null,
    average_gap: null,
    baseline_speedup: null,
  },
};
function useWorkspaceState() {
  const pathname = usePathname();
  const [initialDomain] = useState<Domain>(() =>
    pathname === "/graph" ? "graph" : "sorting",
  );
  const [input, setInput] = useState<Input>(initialInput);
  const [domain, setDomainState] = useState<Domain>(initialDomain);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [history, setHistory] = useState(emptyHistory);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [datasetName, setDatasetName] = useState("Your dataset");
  const [jobId, setJobId] = useState<string | null>(null);
  const [dataType, setDataType] = useState<DataType>("number");
  const [pasteDraft, setPasteDraft] = useState("");
  const [queryDraft, setQueryDraft] = useState("");
  const [inputPending, setInputPending] = useState(false);
  const revision = useRef(0);
  const refreshHistory = useCallback(async () => {
    const value = await api<HistoryData>("/history");
    setHistory(value);
  }, []);
  const analyze = useCallback(async (value: Input, type: Domain) => {
    const version = ++revision.current;
    if (
      !(type === "graph" ? value.nodes.length : value.data.length) ||
      (type === "searching" && !value.queries.length)
    ) {
      setSelection(null);
      setBusy(false);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await api<Selection>(`/${type}/select`, value);
      if (version === revision.current) {
        setSelection(result);
        setConnected(true);
      }
    } catch (e) {
      if (version === revision.current) {
        setError((e as Error).message);
        setConnected(false);
      }
    } finally {
      if (version === revision.current) setBusy(false);
    }
  }, []);
  const changeInput = useCallback(
    (value: Input, type: Domain = domain) => {
      if (jobId) return;
      setInput(value);
      if (
        value.data !== input.data ||
        (type === "graph" &&
          (value.nodes !== input.nodes || value.edges !== input.edges))
      )
        setInputPending(false);
      setSelection(null);
      setJob(null);
      void analyze(value, type);
    },
    [analyze, domain, jobId, input.data, input.nodes, input.edges],
  );
  const setDomain = (value: Domain) => {
    if (jobId || value === domain) return;
    setDomainState(value);
    let pending = false;
    if (value !== "graph") {
      try {
        pending =
          JSON.stringify(parseInputData(pasteDraft, dataType)) !==
            JSON.stringify(input.data) ||
          (value === "searching" &&
            JSON.stringify(parseInputData(queryDraft, dataType)) !==
              JSON.stringify(input.queries));
      } catch {
        pending = true;
      }
    }
    setInputPending(pending);
    setSelection(null);
    setJob(null);
    void analyze(input, value);
  };
  useEffect(() => {
    let live = true;
    Promise.all([api("/health"), api<HistoryData>("/history")])
      .then(([, past]) => {
        if (live) {
          setConnected(true);
          setHistory(past);
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!jobId) return;
    let live = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const current = await api<Job>(`/jobs/${jobId}`);
        if (!live) return;
        setJob(current);
        if (["complete", "error", "cancelled"].includes(current.status)) {
          setJobId(null);
          if (current.error) setError(current.error);
          await refreshHistory();
        } else timer = setTimeout(poll, 400);
      } catch (e) {
        if (live) {
          setError((e as Error).message);
          if (e instanceof ApiError && e.status === 404) {
            setJobId(null);
            setJob((previous) =>
              previous
                ? { ...previous, status: "error", error: e.message }
                : null,
            );
          } else timer = setTimeout(poll, 2500);
        }
      }
    };
    void poll();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [jobId, refreshHistory]);
  const runBenchmark = async () => {
    if (inputPending || !selection || jobId) return;
    setError("");
    setBusy(true);
    try {
      const result = await api<{ job_id: string }>(
        `/${domain}/benchmark`,
        input,
      );
      setJob({
        id: result.job_id,
        kind: "benchmark",
        status: "queued",
        progress: 0,
        current: "Preparing workers",
        results: [],
        cancel_requested: false,
      });
      setJobId(result.job_id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const cancelJob = async () => {
    if (jobId) {
      try {
        setJob(await api<Job>(`/jobs/${jobId}/cancel`, {}));
      } catch (e) {
        setError((e as Error).message);
      }
    }
  };
  return {
    input,
    dataType,
    setDataType,
    queryDraft,
    setQueryDraft,
    pasteDraft,
    setPasteDraft,
    inputPending,
    setInputPending,
    domain,
    setDomain,
    changeInput,
    selection,
    job,
    history,
    busy,
    error,
    setError,
    connected,
    datasetName,
    setDatasetName,
    analyze,
    runBenchmark,
    cancelJob,
    refreshHistory,
    running: !!jobId,
  };
}
type WorkspaceState = ReturnType<typeof useWorkspaceState>;
const Context = createContext<WorkspaceState | null>(null);
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const state = useWorkspaceState();
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export function useWorkspace() {
  const context = useContext(Context);
  if (!context) throw new Error("Workspace provider missing");
  return context;
}
