"use client";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { RefreshCw, Database, X, Download } from "lucide-react";
import { useWorkspace } from "@/hooks/workspace";
import { PageHeading, SectionHeading, Empty } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { BenchmarkResults } from "@/features/benchmark/results";
import { api, format, names, percent } from "@/lib/api";
import type { Job, Result, Selection } from "@/types";
export function History() {
  const w = useWorkspace(),
    [domain, setDomain] = useState("all"),
    [algorithm, setAlgorithm] = useState("all"),
    [date, setDate] = useState(""),
    [minimum, setMinimum] = useState(0),
    [shape, setShape] = useState("all"),
    [detail, setDetail] = useState<Job | null>(null),
    [loading, setLoading] = useState(false);
  const items = w.history.items.filter(
    (e) =>
      (domain === "all" || e.domain === domain) &&
      (algorithm === "all" || e.selected === algorithm) &&
      (!date || e.created_at.slice(0, 10) >= date) &&
      e.profile.n >= minimum &&
      (shape === "all" ||
        (e.profile.disorder !== undefined &&
          (shape === "ordered"
            ? e.profile.disorder < 0.05
            : e.profile.disorder >= 0.05))),
  );
  const evaluated = items.filter((e) => e.matched !== null);
  const chronological = [...evaluated].reverse();
  const series = chronological.map((e, i) => ({
    experiment: i + 1,
    accuracy:
      (chronological
        .slice(0, i + 1)
        .reduce((sum, item) => sum + (item.matched || 0), 0) /
        (i + 1)) *
      100,
    gap: e.performance_gap,
  }));
  const inspect = async (id: string) => {
    setLoading(true);
    try {
      const e = await api<{
        selection: Selection;
        results: Result[];
        selected: string;
        winner: string | null;
        matched: number | null;
        performance_gap: number | null;
        baseline_ms: number | null;
        selected_ms: number | null;
        domain: "sorting" | "searching" | "graph";
      }>(`/history/${id}`);
      setDetail({
        id,
        kind: "benchmark",
        status: "complete",
        progress: 1,
        current: "Stored experiment",
        cancel_requested: false,
        selection: e.selection,
        conditions: e.selection.benchmark_conditions,
        results: e.results,
        summary: {
          id,
          selected: e.selected,
          winner: e.winner,
          matched: e.matched === null ? null : !!e.matched,
          performance_gap: e.performance_gap,
          baseline_ms: e.baseline_ms,
          selected_ms: e.selected_ms,
          baseline_algorithm: {
            sorting: "quick",
            searching: "linear",
            graph: "bellman",
          }[e.domain],
        },
      });
    } catch (e) {
      w.setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  const exportCsv = () => {
    const content = [
      "timestamp,domain,n,selected,winner,selected_ms,gap_percent",
      ...items.map((e) =>
        [
          e.created_at,
          e.domain,
          e.profile.n,
          e.selected,
          e.winner ?? "",
          e.selected_ms ?? "",
          e.performance_gap ?? "",
        ].join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "algoadapt-experiments.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <PageHeading
        eyebrow="EVIDENCE THAT STAYS WITH YOU"
        title="Every experiment teaches the next."
        description="Inspect real measurements, compare predictions, and watch evidence inform future choices."
        action={
          <div className="heading-actions">
            <Button
              variant="outline"
              onClick={() =>
                w.refreshHistory().catch((e) => w.setError(e.message))
              }
            >
              <RefreshCw size={15} /> Refresh
            </Button>
            <Button
              variant="outline"
              onClick={exportCsv}
              disabled={!items.length}
            >
              <Download size={15} /> Export
            </Button>
          </div>
        }
      />
      <div className="history-stats">
        <div>
          <span>RECORDED EXPERIMENTS</span>
          <strong>{items.length.toString().padStart(2, "0")}</strong>
        </div>
        <div>
          <span>PREDICTION ACCURACY</span>
          <strong>
            {evaluated.length
              ? percent(
                  evaluated.reduce((s, e) => s + (e.matched || 0), 0) /
                    evaluated.length,
                )
              : "—"}
          </strong>
        </div>
        <div>
          <span>MEAN GAP TO FASTEST</span>
          <strong>
            {evaluated.length
              ? `${format(evaluated.reduce((s, e) => s + (e.performance_gap || 0), 0) / evaluated.length)}%`
              : "—"}
          </strong>
        </div>
        <div>
          <span>HISTORICAL WEIGHT</span>
          <strong>
            15<small>%</small>
          </strong>
        </div>
      </div>
      <section className="card">
        <SectionHeading
          title="Your experiment ledger"
          detail="SQLite · persisted locally"
        />
        <div className="history-filters">
          <label>
            Domain
            <select value={domain} onChange={(e) => setDomain(e.target.value)}>
              <option value="all">All domains</option>
              {["sorting", "searching", "graph"].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            Predicted algorithm
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
            >
              <option value="all">All algorithms</option>
              {Object.entries(names).map(([id, n]) => (
                <option key={id} value={id}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            Since (UTC)
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label>
            Minimum size
            <input
              type="number"
              min={0}
              value={minimum}
              onChange={(e) => setMinimum(Number(e.target.value))}
            />
          </label>
          <label>
            Dataset shape
            <select value={shape} onChange={(e) => setShape(e.target.value)}>
              <option value="all">All profiles</option>
              <option value="ordered">Low disorder (&lt;5%)</option>
              <option value="disordered">Disordered (≥5%)</option>
            </select>
          </label>
        </div>
        {!items.length ? (
          <Empty
            title="No experiments in this view"
            description="Run a benchmark or adjust your filters. History is populated only by actual completed experiments."
          />
        ) : (
          <div className="table-scroll">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Experiment</th>
                  <th>Input</th>
                  <th>Predicted</th>
                  <th>Actual fastest</th>
                  <th>Gap</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {items.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <button
                        className="text-link"
                        disabled={loading}
                        onClick={() => inspect(e.id)}
                      >
                        #{e.id.slice(0, 7)}
                      </button>
                      <small>{new Date(e.created_at).toLocaleString()}</small>
                    </td>
                    <td>
                      <strong>
                        {format(e.profile.n)}{" "}
                        {e.domain === "graph" ? "nodes" : "elements"}
                      </strong>
                      <small>{e.domain}</small>
                    </td>
                    <td>{names[e.selected]}</td>
                    <td>{e.winner ? names[e.winner] : "No valid result"}</td>
                    <td>
                      {e.performance_gap === null
                        ? "—"
                        : `${format(e.performance_gap)}%`}
                    </td>
                    <td>
                      <span
                        className={`badge ${e.matched ? "badge-green" : "badge-neutral"}`}
                      >
                        {e.matched === null
                          ? "Not evaluated"
                          : e.matched
                            ? "Matched"
                            : "Mismatch"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <div className="history-bottom">
        <section className="card">
          <SectionHeading
            title="How often did the prediction match?"
            detail="Cumulative accuracy · filtered history"
          />
          {series.length ? (
            <div className="history-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={series}
                  margin={{ top: 15, right: 20, bottom: 15, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 5" />
                  <XAxis dataKey="experiment" tick={{ fontSize: 12 }} />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={(v) => `${format(Number(v))}%`} />
                  <Line
                    dataKey="accuracy"
                    name="Cumulative match rate"
                    stroke="#4d8390"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="no-chart">
              Your first completed benchmark starts this curve.
            </p>
          )}
        </section>
        <section className="adaptive-note">
          <Database size={24} />
          <h2>Adaptation you can explain.</h2>
          <p>
            Similar inputs contribute empirical evidence to the next
            recommendation. The best measured time divided by each candidate’s
            time becomes its historical signal.
          </p>
          <p>
            The core rules still carry 85% of the decision. No opaque model and
            no claim of universal optimality.
          </p>
          <small>
            Accuracy uses only experiments in which the selected algorithm
            finished. Close timings are sensitive to system noise. History
            displays the latest 500 experiments.
          </small>
        </section>
      </div>
      {detail && (
        <section className="history-detail">
          <SectionHeading title={`Experiment #${detail.id.slice(0, 7)}`}>
            <Button variant="outline" size="sm" onClick={() => setDetail(null)}>
              <X size={14} /> Close details
            </Button>
          </SectionHeading>
          <BenchmarkResults job={detail} selection={detail.selection} />
        </section>
      )}
    </>
  );
}
