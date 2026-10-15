"use client";
import Link from "next/link";
import { useWorkspace } from "@/hooks/workspace";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Play, Square, BookOpen, Info } from "lucide-react";
import { api, ApiError, format, names } from "@/lib/api";
import type { Job, Metadata } from "@/types";
import { PageHeading, SectionHeading } from "@/components/shared";
import { Button } from "@/components/ui/button";
const curves = [
  { id: "constant", name: "O(1)", color: "#8b9ca0" },
  { id: "log", name: "O(log n)", color: "#9b88b4" },
  { id: "linear", name: "O(n)", color: "#539189" },
  { id: "nlog", name: "O(n log n)", color: "#dcaa44" },
  { id: "square", name: "O(n²)", color: "#e96540" },
];
export function Complexity() {
  const w = useWorkspace();
  const cap = Math.min(w.input.data.length, 4000);
  const sizes = [
    ...new Set(
      [0.2, 0.4, 0.6, 0.8, 1].map((f) => Math.max(2, Math.floor(cap * f))),
    ),
  ].filter((n) => n <= cap);
  const [maxN, setMaxN] = useState(128),
    [logScale, setLogScale] = useState(true),
    [visible, setVisible] = useState(curves.map((c) => c.id)),
    [catalog, setCatalog] = useState<Record<string, Metadata>>({}),
    [algorithm, setAlgorithm] = useState("merge"),
    [job, setJob] = useState<Job | null>(null),
    [jobId, setJobId] = useState<string | null>(null),
    [error, setError] = useState(""),
    [metric, setMetric] = useState("runtime_ms"),
    [starting, setStarting] = useState(false);
  useEffect(() => {
    api<{ algorithms: Record<string, Metadata> }>("/metadata")
      .then((r) => setCatalog(r.algorithms))
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!jobId) return;
    let live = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const j = await api<Job>(`/jobs/${jobId}`);
        if (!live) return;
        setJob(j);
        if (["complete", "cancelled", "error"].includes(j.status)) {
          setJobId(null);
          if (j.error) setError(j.error);
        } else timer = setTimeout(poll, 500);
      } catch (e) {
        if (live) {
          setError((e as Error).message);
          if (e instanceof ApiError && e.status === 404) setJobId(null);
          else timer = setTimeout(poll, 2500);
        }
      }
    };
    void poll();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [jobId]);
  const data = Array.from({ length: 64 }, (_, i) => {
    const n = Math.max(1, Math.round(1 + (i * (maxN - 1)) / 63));
    return {
      n,
      constant: 1,
      log: Math.max(1, Math.log2(n)),
      linear: n,
      nlog: Math.max(1, n * Math.log2(n)),
      square: n * n,
    };
  });
  const run = async () => {
    setError("");
    setStarting(true);
    try {
      const r = await api<{ job_id: string }>("/complexity/empirical", {
        algorithm,
        data: w.input.data,
        sizes,
      });
      setJob(null);
      setJobId(r.job_id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStarting(false);
    }
  };
  const metadata = catalog[algorithm];
  const numericOnly =
    typeof w.input.data[0] === "string" &&
    ["counting", "radix"].includes(algorithm);
  return (
    <>
      <PageHeading
        eyebrow="THEORETICAL GROWTH × OBSERVED BEHAVIOR"
        title="See what complexity really means."
        description="Growth tells one story. Measurements tell another. Explore both, side by side."
      />
      <section className="card complexity-chart">
        <SectionHeading
          title="How does the work grow?"
          detail="THEORETICAL REFERENCE"
        >
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={logScale}
              onChange={(e) => setLogScale(e.target.checked)}
            />{" "}
            Logarithmic Y-axis
          </label>
        </SectionHeading>
        <div className="curve-controls">
          {curves.map((c) => (
            <button
              key={c.id}
              style={{
                borderColor: visible.includes(c.id) ? c.color : undefined,
                color: visible.includes(c.id) ? c.color : undefined,
              }}
              className={visible.includes(c.id) ? "chosen" : ""}
              onClick={() =>
                setVisible(
                  visible.includes(c.id)
                    ? visible.filter((x) => x !== c.id)
                    : [...visible, c.id],
                )
              }
            >
              <i style={{ background: c.color }} />
              {c.name}
            </button>
          ))}
          <label>
            Maximum n
            <select
              value={maxN}
              onChange={(e) => setMaxN(Number(e.target.value))}
            >
              {[32, 128, 512, 2048].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
        <div
          className="theory-chart"
          role="img"
          aria-label="Theoretical complexity growth curves"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ left: 12, right: 20, top: 20, bottom: 28 }}
            >
              <CartesianGrid strokeDasharray="3 6" stroke="#e7e8e4" />
              <XAxis
                dataKey="n"
                type="number"
                domain={[1, maxN]}
                tick={{ fontSize: 12 }}
                label={{
                  value: "Input size (n)",
                  position: "bottom",
                  offset: 8,
                }}
              />
              <YAxis
                scale={logScale ? "log" : "auto"}
                domain={logScale ? [1, "auto"] : [0, "auto"]}
                allowDataOverflow
                tick={{ fontSize: 12 }}
                tickFormatter={(v) =>
                  v >= 1000 ? `${format(v / 1000, 0)}k` : format(v, 0)
                }
              />
              <Tooltip formatter={(v) => format(Number(v))} />
              {curves
                .filter((c) => visible.includes(c.id))
                .map((c) => (
                  <Line
                    key={c.id}
                    dataKey={c.id}
                    name={c.name}
                    stroke={c.color}
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="footnote">
          <Info size={14} /> Relative operation growth, with coefficients set to
          1. These are theoretical functions, not benchmark measurements.
          log₂(n) is clamped to 1 at n=1 for the log axis.
        </p>
      </section>
      <div className="complexity-bottom">
        <section className="card algorithm-reference">
          <SectionHeading title="Know the algorithm" />
          <label>
            Algorithm
            <select
              value={algorithm}
              disabled={!!jobId}
              onChange={(e) => setAlgorithm(e.target.value)}
            >
              {Object.entries(catalog)
                .filter(([, m]) => m.domain === "sorting")
                .map(([id, m]) => (
                  <option key={id} value={id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </label>
          {metadata && (
            <>
              <div className="complexity-facts">
                {[
                  ["Best case", metadata.best],
                  ["Average case", metadata.average],
                  ["Worst case", metadata.worst],
                  ["Auxiliary space", metadata.space],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span>{k}</span>
                    <b>{v}</b>
                  </div>
                ))}
              </div>
              <div className="metadata-tags">
                <span className="badge badge-neutral">
                  {metadata.stable ? "Stable" : "Unstable"}
                </span>
                <span className="badge badge-neutral">
                  {metadata.inplace ? "In-place core" : "Auxiliary arrays"}
                </span>
              </div>
              <p>{metadata.notes}</p>
              {metadata.recurrence && (
                <div className="recurrence">
                  <BookOpen size={17} />
                  <code>{metadata.recurrence}</code>
                </div>
              )}
              <p className="footnote">
                In-place describes the algorithm core. The benchmark wrapper
                also copies input and retains returned output.
              </p>
            </>
          )}
        </section>
        <section className="card empirical">
          <SectionHeading
            title="Now measure it"
            detail="EMPIRICAL EXPERIMENT"
          />
          <p>
            Run {names[algorithm]} on increasing prefixes of your analyzed data.
            Sizes: {sizes.join(", ") || "add at least 3 values first"}. No
            values are generated.
          </p>
          {numericOnly && (
            <p className="note-box">
              This implementation requires integers. Choose Insertion, Merge,
              Quick, or Heap Sort for text.
            </p>
          )}
          {typeof w.input.data[0] === "string" && (
            <p className="footnote">
              For text, a comparison may inspect up to L characters. The
              reference curves count value-level operations; measured runtime
              includes character work.
            </p>
          )}
          <div className="empirical-controls">
            <label>
              Metric
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
              >
                <option value="runtime_ms">Median runtime (ms)</option>
                <option value="operations">Operations</option>
              </select>
            </label>
            <Button
              disabled={
                !!jobId ||
                starting ||
                sizes.length < 2 ||
                w.inputPending ||
                numericOnly
              }
              onClick={run}
            >
              <Play size={14} />
              {jobId ? "Measuring…" : "Run experiment"}
            </Button>
            {jobId && (
              <Button
                variant="outline"
                size="icon"
                aria-label="Cancel empirical experiment"
                onClick={() => {
                  void api(`/jobs/${jobId}/cancel`, {}).catch((e) =>
                    setError(e.message),
                  );
                }}
              >
                <Square size={14} />
              </Button>
            )}
          </div>
          {error && (
            <p className="text-error" role="alert">
              {error}
            </p>
          )}
          {jobId && (
            <div className="empirical-progress">
              <progress max={1} value={job?.progress || 0} />
              <span>{job?.current || "Starting isolated workers…"}</span>
            </div>
          )}
          {job?.results.some((r) => r.status === "ok") ? (
            <div className="empirical-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={job.results
                    .filter((r) => r.status === "ok")
                    .map((r) => ({ ...r, operations: r.metrics?.operations }))}
                  margin={{ left: 0, right: 20, top: 16, bottom: 12 }}
                >
                  <CartesianGrid strokeDasharray="3 5" />
                  <XAxis dataKey="n" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => format(v)}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    dataKey={metric}
                    name={
                      metric === "operations"
                        ? "Measured operations"
                        : "Median time (ms)"
                    }
                    stroke="#e96c43"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empirical-placeholder">
              <Link href="/selector" className="text-link">
                Paste or upload your data in Algorithm studio →
              </Link>
              <p>Your measured growth curve will appear here.</p>
            </div>
          )}
          {job?.results
            .filter((r) => r.status !== "ok")
            .map((r) => (
              <p key={r.n} className="text-error">
                n={r.n}: {r.status}. {r.error}
              </p>
            ))}
          {job?.status === "cancelled" && <p>Experiment cancelled.</p>}
          <p className="footnote">
            Prefixes preserve your original input order, up to the first 4,000
            values. Observed behavior compared with theoretical complexity. A
            few measurements do not prove an asymptotic bound. Empirical sweeps
            are separate from adaptive history.
          </p>
        </section>
      </div>
    </>
  );
}
