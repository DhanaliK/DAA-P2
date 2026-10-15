"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  ShieldCheck,
  Sparkles,
  Ban,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { useWorkspace } from "@/hooks/workspace";
import { Button } from "@/components/ui/button";
import { Empty, Loading, SectionHeading } from "@/components/shared";
import { format } from "@/lib/api";
import type { Candidate, ComponentKey, Selection } from "@/types";
export const componentLabels: Record<ComponentKey, string> = {
  complexity: "Complexity",
  fit: "Dataset fit",
  memory: "Memory",
  history: "History",
};
export const componentColors: Record<ComponentKey, string> = {
  complexity: "#eb673e",
  fit: "#407e8d",
  memory: "#9891bb",
  history: "#c6b476",
};
export function ScoreBreakdown({
  candidate,
  selection,
}: {
  candidate: Candidate;
  selection: Selection;
}) {
  return (
    <div className="score-breakdown">
      {(Object.keys(selection.weights) as ComponentKey[]).map((k) => (
        <div key={k}>
          <div>
            <i style={{ background: componentColors[k] }} />
            <span>{componentLabels[k]}</span>
            <small>{selection.weights[k] * 100}% weight</small>
            <b>{format(candidate.components[k] * 100, 0)}</b>
          </div>
          <span className="meter">
            <i
              style={{
                width: `${candidate.components[k] * 100}%`,
                background: componentColors[k],
              }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}
export function Recommendation() {
  const w = useWorkspace(),
    [expanded, setExpanded] = useState<string | null>(null);
  const s = w.selection,
    top = s?.candidates.find((c) => c.id === s.recommended);
  if (w.inputPending)
    return (
      <div className="pending-decision card">
        <span className="eyebrow">STEP 1 · DRAFT INPUT</span>
        <Empty
          title="Your changes have not been analyzed"
          description={
            w.domain === "graph"
              ? "Press Apply graph to analyze your edited connections before playback or benchmarking."
              : "Press Analyze input to build a recommendation for this draft. The last analyzed input remains visible below the editor for comparison."
          }
        />
      </div>
    );
  if (w.busy && !s) return <Loading />;
  if (!s || !top)
    return (
      <Empty
        title="Your next decision starts with data"
        description={
          w.domain === "graph"
            ? "Paste or upload your edges and press Apply graph to begin."
            : "Type, paste, or upload your data, then press Analyze input. For searching, enter the target values too."
        }
      />
    );
  return (
    <>
      <section className="recommendation-card">
        <div className="recommendation-top">
          <span>
            <Sparkles size={15} /> THE RECOMMENDATION
          </span>
          <span className="live-badge">RULE-BASED</span>
        </div>
        <div className="winner-title">
          <div>
            <h2>{top.name}</h2>
            <p>Highest suitability score for the analyzed input.</p>
          </div>
          <div className="score-circle">
            <strong>{format(top.score, 0)}</strong>
            <span>/ 100</span>
          </div>
        </div>
        <p className="score-explanation">
          The score combines complexity, data fit, memory, and past experiments.
          It is not a speed measurement or a correctness percentage.
        </p>
        <div className="complexity-pills">
          <span>
            <small>AVERAGE TIME</small>
            <b>{top.metadata.average}</b>
          </span>
          <span>
            <small>AUXILIARY SPACE</small>
            <b>{top.metadata.space}</b>
          </span>
        </div>
        <div className="winner-reasons">
          {top.reasons.slice(0, 2).map((r, i) => (
            <p key={i}>
              <Check size={15} />
              {r}
            </p>
          ))}
        </div>
        <div className="recommendation-bottom">
          <span>
            <ShieldCheck size={15} />
            {top.history_samples
              ? `${top.history_samples} historical matches`
              : "Transparent. No black box."}
          </span>
          <Link href="/explainability">
            See reasoning <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
      <div className="validate-callout">
        <div>
          <FlaskConical size={20} />
          <span>
            <strong>Watch first. Then measure.</strong>
            <small>Run benchmark to measure time and verify each result.</small>
          </span>
        </div>
        <Button asChild>
          <Link href="/benchmark">Open benchmark lab</Link>
        </Button>
      </div>
      <a className="watch-link" href="#visual-playback">
        Watch this algorithm step by step ↓
      </a>
      <section className="card ranking-card">
        <SectionHeading
          step="02"
          title="The contenders"
          detail={`${s.candidates.filter((c) => c.eligible).length} eligible`}
        />
        <div className="ranking-legend">
          ALGORITHM <span>SUITABILITY / 100</span>
        </div>
        <div className="ranking-list">
          {s.candidates.map((c, i) => (
            <div
              key={c.id}
              className={`rank-item ${c.id === s.recommended ? "first" : ""} ${!c.eligible ? "excluded" : ""}`}
            >
              <button
                className="rank-row"
                aria-expanded={expanded === c.id}
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              >
                <span className="rank-number">
                  {c.eligible ? (
                    String(i + 1).padStart(2, "0")
                  ) : (
                    <Ban size={14} />
                  )}
                </span>
                <span className="rank-name">
                  <b>{c.name}</b>
                  <small>
                    {c.eligible ? c.metadata.average : "Not applicable"}
                  </small>
                </span>
                <span className="rank-bar">
                  <i style={{ width: `${c.score}%` }} />
                </span>
                <strong>{c.eligible ? format(c.score, 1) : "—"}</strong>
                {expanded === c.id ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>
              {expanded === c.id && (
                <div className="rank-detail">
                  {c.eligible ? (
                    <>
                      <ScoreBreakdown candidate={c} selection={s} />
                      {c.id !== s.recommended && (
                        <p>
                          Ranks {format(top.score - c.score)} points below{" "}
                          {top.name} under the same weights.
                        </p>
                      )}
                    </>
                  ) : (
                    c.exclusions.map((r) => <p key={r}>{r}</p>)
                  )}
                  {c.reasons.map((r) => (
                    <p key={r}>{r}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="footnote">
          <Info size={14} /> Scores describe suitability, not a promise of
          speed.
        </p>
      </section>
    </>
  );
}
