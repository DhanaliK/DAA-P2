"use client";
import Link from "next/link";
import { useWorkspace } from "@/hooks/workspace";
import { PageHeading, Empty, SectionHeading } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  ScoreBreakdown,
  componentColors,
  componentLabels,
} from "@/features/selector/recommendation";
import { Check, Ban, Database, Scale } from "lucide-react";
import { format } from "@/lib/api";
import type { ComponentKey } from "@/types";
export function Insights() {
  const w = useWorkspace(),
    s = w.selection,
    top = s?.candidates.find((c) => c.id === s.recommended);
  return (
    <>
      <PageHeading
        eyebrow="OPEN THE BLACK BOX. THERE ISN’T ONE."
        title="Every point has a reason."
        description="Inspect the rules, weights, and evidence behind this exact recommendation."
        action={
          <Button asChild variant="outline">
            <Link href="/selector">Change the input</Link>
          </Button>
        }
      />
      {!s || !top ? (
        <Empty
          title="Analyze an input first"
          description="The decision trace is generated from your actual dataset."
        />
      ) : (
        <>
          <div className="formula-banner">
            <Scale size={28} />
            <div>
              <span className="eyebrow">
                ONE FIXED FORMULA. EVERY CANDIDATE.
              </span>
              <h2>
                Suitability ={" "}
                {Object.entries(s.weights).map(([k, v], i) => (
                  <span
                    key={k}
                    style={{ color: componentColors[k as ComponentKey] }}
                  >
                    {i > 0 && " + "}
                    {v * 100}% {componentLabels[k as ComponentKey]}
                  </span>
                ))}
              </h2>
              <p>
                Hard constraints filter first. The same weights rank every
                eligible candidate. Scores are not confidence probabilities.
              </p>
            </div>
          </div>
          <div className="insights-grid">
            <section className="card">
              <SectionHeading
                title={`Why ${top.name}?`}
                detail={`${format(top.score)} / 100`}
              />
              <div className="reason-list">
                {top.reasons.map((r, i) => (
                  <div key={r}>
                    <span>
                      <Check size={16} />
                    </span>
                    <div>
                      <small>REASON {i + 1}</small>
                      <p>{r}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="history-evidence">
                <Database size={22} />
                <div>
                  <b>{s.similar_experiments} similar historical experiments</b>
                  <p>
                    Match within a factor of 2 in size; compare disorder,
                    duplicate ratio, range, and task context. The last 20
                    matches contribute normalized runtime evidence.
                  </p>
                  <p>
                    History score = (1 + sum of fastest/runtime ratios) ÷ (2 +
                    sample count). Two neutral pseudo-observations soften noisy
                    runs.
                  </p>
                </div>
              </div>
            </section>
            <section className="card">
              <SectionHeading title="The score, unpacked" />
              <ScoreBreakdown candidate={top} selection={s} />
              <div className="score-math">
                {(Object.keys(s.weights) as ComponentKey[]).map((k) => (
                  <div key={k}>
                    <span>
                      {format(top.components[k], 3)} × {s.weights[k]}
                    </span>
                    <b>{format(top.components[k] * s.weights[k] * 100)} pts</b>
                  </div>
                ))}
                <div className="score-total">
                  <span>Final suitability</span>
                  <b>{format(top.score)} / 100</b>
                </div>
              </div>
              <p className="footnote">
                Complexity component = √(minimum eligible estimated work ÷
                candidate estimated work). Work estimates omit implementation
                constants and are not runtime forecasts.
              </p>
            </section>
          </div>
          <section className="card why-not">
            <SectionHeading title="And why not the others?" />
            <div>
              {s.candidates
                .filter((c) => c.id !== s.recommended)
                .map((c) => (
                  <article key={c.id}>
                    <div>
                      <span
                        className={`badge ${c.eligible ? "badge-neutral" : "badge-red"}`}
                      >
                        {c.eligible ? (
                          `${format(c.score)} points`
                        ) : (
                          <>
                            <Ban size={12} /> Excluded
                          </>
                        )}
                      </span>
                      <h3>{c.name}</h3>
                    </div>
                    {!c.eligible ? (
                      c.exclusions.map((r) => <p key={r}>{r}</p>)
                    ) : (
                      <>
                        <p>
                          {format(top.score - c.score)} points below {top.name}.{" "}
                          {c.metadata.notes}
                        </p>
                        <ScoreBreakdown candidate={c} selection={s} />
                      </>
                    )}
                  </article>
                ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
