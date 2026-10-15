"use client";
import Link from "next/link";
import { Play, Square, FlaskConical, RefreshCw } from "lucide-react";
import { useWorkspace } from "@/hooks/workspace";
import { PageHeading, Empty } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { format, names } from "@/lib/api";
import { WorkflowGuide } from "@/components/workflow-guide";
import { BenchmarkResults } from "./results";
export function Benchmark() {
  const w = useWorkspace();
  return (
    <>
      <PageHeading
        eyebrow="THE EXPERIMENTAL WORKSPACE"
        title="A good prediction deserves a test."
        description="Same input. Real execution. Every eligible algorithm gets a fair run."
        action={
          <Button variant="outline" asChild>
            <Link href={w.domain === "graph" ? "/graph" : "/selector"}>
              Change input
            </Link>
          </Button>
        }
      />
      <WorkflowGuide benchmark />
      {w.inputPending && (
        <p className="note-box" role="status">
          You have an unanalyzed draft.{" "}
          <Link href="/selector">Return to Algorithm studio</Link> and analyze
          it before running a benchmark.
        </p>
      )}
      <section className="benchmark-config card">
        <div className="experiment-icon">
          <FlaskConical size={26} />
        </div>
        <div>
          <span className="eyebrow">CURRENT EXPERIMENT · {w.domain}</span>
          <h2>
            {w.domain === "graph"
              ? `${w.input.nodes.length} vertices · ${w.input.task}`
              : w.datasetName}
          </h2>
          <p>
            {format(w.selection?.profile.n)}{" "}
            {w.domain === "graph" ? "vertices" : "elements"} ·{" "}
            {w.selection?.candidates.filter((c) => c.eligible).length ?? 0}{" "}
            eligible algorithms · prediction:{" "}
            <b>{names[w.selection?.recommended || ""] || "pending"}</b>
          </p>
        </div>
        <label>
          Repeated trials
          <select
            aria-label="Benchmark trials"
            value={w.input.trials}
            disabled={w.running || w.busy || w.inputPending}
            onChange={(e) =>
              w.changeInput({ ...w.input, trials: Number(e.target.value) })
            }
          >
            {[1, 3, 5].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "trial" : "trials"}
              </option>
            ))}
          </select>
        </label>
        <Button
          disabled={w.busy || !w.selection || w.running || w.inputPending}
          onClick={w.runBenchmark}
        >
          {w.job ? <RefreshCw size={16} /> : <Play size={16} />}{" "}
          {w.running
            ? "Running experiment…"
            : w.job
              ? "Run again"
              : "Run benchmark"}
        </Button>
      </section>
      <p className="benchmark-boundary">
        {w.selection?.candidates.filter((c) => c.eligible).length || 0} workers
        run sequentially, with an 8-second limit each. Insertion Sort is skipped
        above 2 million inversions. Memory is measured in a separate pass.
      </p>
      {w.running && (
        <div className="progress-panel" role="status">
          <div>
            <span className="pulse-dot" />
            <strong>Measuring {w.job?.current}…</strong>
            <span>{format((w.job?.progress || 0) * 100, 0)}%</span>
            <Button
              size="sm"
              variant="outline"
              disabled={w.job?.cancel_requested}
              onClick={w.cancelJob}
            >
              <Square size={12} />
              {w.job?.cancel_requested ? "Cancelling…" : "Cancel"}
            </Button>
          </div>
          <progress value={w.job?.progress || 0} max={1} />
          <small>
            Runtime excludes process startup, verification, and the separate
            memory pass.
          </small>
        </div>
      )}
      {w.job?.status === "cancelled" && (
        <p className="note-box">
          Experiment cancelled. Partial measurements were not added to adaptive
          history.
        </p>
      )}
      {w.job?.results.length ? (
        <BenchmarkResults
          job={w.job}
          selection={w.job.selection || w.selection}
        />
      ) : (
        !w.running && (
          <div className="benchmark-empty">
            <div className="empty-race">
              <span />
              <span />
              <span />
              <span />
            </div>
            <Empty
              title="The theory is ready. Start the stopwatch."
              description="Your result will include runtime, operation counts, correctness, memory, and the gap between prediction and reality."
            />
          </div>
        )
      )}
    </>
  );
}
