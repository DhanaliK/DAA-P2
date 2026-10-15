"use client";
import {
  ArrowRight,
  Check,
  Circle,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { format, percent } from "@/lib/api";
import type { DataValue, Profile } from "@/types";
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">
          <span />
          {eyebrow}
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function SectionHeading({
  step,
  title,
  detail,
  children,
}: {
  step?: string;
  title: string;
  detail?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {step && <span className="step-number">{step}</span>}
        <h2>{title}</h2>
        {detail && <span className="section-detail">{detail}</span>}
      </div>
      {children}
    </div>
  );
}
export function Pipeline({ stage = 2 }: { stage?: number }) {
  return (
    <div className="pipeline">
      {[
        "Input",
        "Analyze",
        "Select",
        "Explain",
        "Benchmark",
        "Compare",
        "Adapt",
      ].map((s, i) => (
        <div className={i <= stage ? "passed" : ""} key={s}>
          <span>
            {i < stage ? (
              <Check size={12} />
            ) : i === stage ? (
              <Circle size={9} fill="currentColor" />
            ) : (
              `0${i + 1}`
            )}
          </span>
          <b>{s}</b>
          {i < 6 && <ArrowRight size={14} />}
        </div>
      ))}
    </div>
  );
}
export function DatasetBars({
  data,
  ordered = false,
}: {
  data: DataValue[];
  ordered?: boolean;
}) {
  if (typeof data[0] === "string")
    return (
      <div
        className={`text-values ${ordered ? "ordered" : ""}`}
        aria-label={`Text values ${ordered ? "sorted" : "in input order"}`}
      >
        {data.slice(0, 80).map((value, i) => (
          <span key={i} title={String(value)}>
            <small>{i}</small>
            <code>{JSON.stringify(value)}</code>
          </span>
        ))}
      </div>
    );
  const values = data.slice(0, 80) as number[];
  const min = Math.min(...values, 0),
    max = Math.max(...values, 1);
  return (
    <div
      className={`dataset-bars ${ordered ? "ordered" : ""}`}
      aria-label={`${values.length} sample values ${ordered ? "sorted" : "in input order"}`}
    >
      {values.map((v, i) => (
        <span
          key={i}
          title={`Element ${i + 1}: ${v}`}
          style={{
            height: `${8 + ((v - min) / Math.max(1, max - min)) * 92}%`,
            animationDelay: `${i * 5}ms`,
          }}
        />
      ))}
    </div>
  );
}
export function ProfileMetrics({ profile: p }: { profile: Profile }) {
  const graph = p.vertices !== undefined;
  const metrics = graph
    ? [
        ["Vertices", format(p.vertices)],
        ["Edges", format(p.edges)],
        ["Density", percent(p.density)],
        ["Negative edges", format(p.negative_edges)],
      ]
    : [
        ["Elements", format(p.n)],
        ["Adjacent order", percent(p.sortedness)],
        ["Duplicates", percent(p.duplicate_ratio)],
        p.data_type === "text"
          ? ["Longest value", `${format(p.max_length)} chars`]
          : ["Value range", format(p.range)],
      ];
  return (
    <div className="profile-metrics">
      {metrics.map(([label, value]) => (
        <div key={label}>
          <small>{label}</small>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}
export function Empty({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <Sparkles size={27} />
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading-state">
      <LoaderCircle className="spin" size={22} /> Analyzing your input…
    </div>
  );
}
