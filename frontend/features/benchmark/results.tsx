"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CheckCircle2, Target, Trophy, ArrowRight, Info } from "lucide-react";
import type { Job, Selection } from "@/types";
import { format, names } from "@/lib/api";
import { SectionHeading } from "@/components/shared";
import { OutputPreview } from "./output-preview";
export function BenchmarkResults({
  job,
  selection,
}: {
  job: Job;
  selection?: Selection | null;
}) {
  const good = job.results.filter((r) => r.status === "ok");
  const data = good.map((r) => ({
    name: names[r.algorithm],
    runtime: r.runtime_ms,
    operations: r.metrics?.operations,
    id: r.algorithm,
  }));
  const s = job.summary;
  return (
    <div className="results-area">
      <OutputPreview job={job} />
      {s && (
        <div
          className={`prediction-comparison ${s.matched ? "matched" : "mismatch"}`}
        >
          <div>
            <span>
              <Target size={16} /> PREDICTED BEST FIT
            </span>
            <strong>{names[s.selected]}</strong>
          </div>
          <ArrowRight className="comparison-arrow" />
          <div>
            <span>
              <Trophy size={16} /> MEASURED FASTEST
            </span>
            <strong>{s.winner ? names[s.winner] : "No valid result"}</strong>
          </div>
          <div className="match-explanation">
            <span className="badge">
              {s.matched === null
                ? "Prediction not evaluated"
                : s.matched
                  ? "Prediction matched"
                  : "New evidence collected"}
            </span>
            <p>
              {s.performance_gap !== null
                ? `${format(s.performance_gap)}% gap to fastest`
                : "The selected algorithm did not finish successfully."}
            </p>
          </div>
        </div>
      )}
      {good.length > 0 && (
        <div className="chart-grid">
          <section className="card">
            <SectionHeading
              title="Who was actually fastest?"
              detail="Median runtime · ms"
            />
            <div
              className="chart-wrap"
              role="img"
              aria-label="Measured median runtime comparison"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ left: 5, right: 24, top: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 5"
                    horizontal={false}
                    stroke="#e9e9e5"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => format(v, 2)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={112}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v) => `${format(Number(v), 4)} ms`}
                    contentStyle={{ borderRadius: 10, borderColor: "#e5e5e0" }}
                  />
                  <Bar dataKey="runtime" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {data.map((d) => (
                      <Cell
                        key={d.id}
                        fill={d.id === s?.winner ? "#eb673e" : "#b8c5c7"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="card">
            <SectionHeading
              title="How much work did it do?"
              detail="Instrumented operations"
            />
            <div
              className="chart-wrap"
              role="img"
              aria-label="Measured operations comparison"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 12, right: 15, bottom: 5, left: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 5"
                    vertical={false}
                    stroke="#e9e9e5"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => v.split(" ")[0]}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${format(v / 1000, 0)}k` : v
                    }
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="operations"
                    fill="#4d8390"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}
      <section className="card results-table">
        <SectionHeading
          title="The measurement ledger"
          detail="Correctness checked before recording"
        />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Median time</th>
                <th>Comparisons</th>
                <th>Moves / swaps</th>
                <th>Peak allocation</th>
                <th>Correctness</th>
              </tr>
            </thead>
            <tbody>
              {job.results.map((r) => (
                <tr key={`${r.algorithm}-${r.n}`}>
                  <td>
                    <strong>{names[r.algorithm]}</strong>
                    {r.algorithm === selection?.recommended && (
                      <small>Predicted best fit</small>
                    )}
                    {r.error && <small className="text-error">{r.error}</small>}
                  </td>
                  <td>
                    {r.runtime_ms == null
                      ? "—"
                      : `${format(r.runtime_ms, 4)} ms`}
                  </td>
                  <td>{format(r.metrics?.comparisons)}</td>
                  <td>
                    {format(r.metrics?.moves)} / {format(r.metrics?.swaps)}
                  </td>
                  <td>
                    {r.peak_bytes == null
                      ? "—"
                      : `${format(r.peak_bytes / 1024)} KB`}
                  </td>
                  <td>
                    <span
                      className={`badge ${r.correct ? "badge-green" : "badge-neutral"}`}
                    >
                      {r.correct && <CheckCircle2 size={12} />}{" "}
                      {r.correct ? "Verified" : r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {s && (
        <section className="baseline-card">
          <div>
            <span className="eyebrow">FIXED BASELINE VS ADAPTIVE CHOICE</span>
            <h3>
              {names[s.baseline_algorithm]} vs {names[s.selected]}
            </h3>
            <p>
              A fixed strategy gives your adaptive decision a meaningful
              reference point.
            </p>
          </div>
          <div>
            <small>BASELINE</small>
            <strong>
              {s.baseline_ms === null
                ? "Not measured"
                : `${format(s.baseline_ms, 4)} ms`}
            </strong>
          </div>
          <div>
            <small>ADAPTIVE</small>
            <strong>
              {s.selected_ms === null
                ? "Not measured"
                : `${format(s.selected_ms, 4)} ms`}
            </strong>
          </div>
        </section>
      )}
      {s && !s.matched && (
        <p className="note-box">
          <Info size={18} /> A suitability score is a hypothesis. Constants,
          Python overhead, input distribution, cache behavior, and system load
          can change the measured winner. This result becomes evidence for
          future similar inputs.
        </p>
      )}
      {job.conditions && (
        <details className="methodology">
          <summary>Benchmark conditions & measurement boundaries</summary>
          <p>{job.conditions.fairness}</p>
          <p>{job.conditions.memory}</p>
          <p>{job.conditions.operations}</p>
          <p>
            {job.conditions.runtime} · {job.conditions.trials} trials · 1
            discarded warmup · {job.conditions.timeout_seconds}s worker limit.
          </p>
          <p>
            The fastest result is the winner among completed, eligible
            algorithms. Skips and timeouts are visible and excluded. Very close
            timings can change between runs.
          </p>
        </details>
      )}
    </div>
  );
}
