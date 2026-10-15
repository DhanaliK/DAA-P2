"use client";
import type { DataValue, Job } from "@/types";
import { DatasetBars, SectionHeading } from "@/components/shared";
import { names } from "@/lib/api";
export function OutputPreview({ job }: { job: Job }) {
  const result =
    job.results.find(
      (r) => r.status === "ok" && r.algorithm === job.selection?.recommended,
    ) || job.results.find((r) => r.status === "ok");
  if (!result || !Array.isArray(result.output)) return null;
  const sorting = job.selection?.domain === "sorting";
  return (
    <section className="card output-preview">
      <SectionHeading
        title={
          sorting
            ? "From input to ordered output"
            : "The actual membership answers"
        }
        detail={`${names[result.algorithm]} · verified result`}
      />
      {sorting ? (
        <DatasetBars data={result.output as DataValue[]} ordered />
      ) : (
        <div className="query-results">
          {(result.output as boolean[]).slice(0, 30).map((found, i) => (
            <span
              className={`badge ${found ? "badge-green" : "badge-neutral"}`}
              key={i}
            >
              Query {i + 1}: {found ? "found" : "absent"}
            </span>
          ))}
        </div>
      )}
      <details>
        <summary>
          Inspect returned values {result.output_truncated && "(first 120)"}
        </summary>
        <pre>{JSON.stringify(result.output, null, 0)}</pre>
      </details>
      <p className="footnote">
        {sorting
          ? "Up to 80 actual sorted values are shown: bars for integers, labeled cards for text."
          : "Answers correspond to the submitted queries in their original order."}{" "}
        Full output was checked for correctness before this preview was
        returned.
      </p>
    </section>
  );
}
