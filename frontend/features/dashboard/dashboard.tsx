"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownWideNarrow,
  Search,
  Network,
  Zap,
  FlaskConical,
  Target,
  GitBranch,
  Activity,
  FileInput,
} from "lucide-react";
import { useWorkspace } from "@/hooks/workspace";
import { Button } from "@/components/ui/button";
import { DatasetBars, SectionHeading, Empty } from "@/components/shared";
import { format, names, percent } from "@/lib/api";
export function Dashboard() {
  const w = useWorkspace(),
    s = w.history.stats,
    top = w.inputPending ? undefined : w.selection?.candidates[0];
  return (
    <>
      <div className="dashboard-intro">
        <div className="eyebrow">
          <span /> ADAPTIVE ALGORITHM SELECTION
        </div>
        <span className="version-tag">EXPERIMENT. UNDERSTAND. REPEAT.</span>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-overline">
            <GitBranch size={16} /> ONE INPUT. A BETTER DECISION.
          </span>
          <h1>
            Different data.
            <br />
            Different <em>best algorithm.</em>
          </h1>
          <p>
            Don’t just run an algorithm. Understand why it fits.
            <br />
            Analyze your input, compare the candidates, and let real performance
            have the final word.
          </p>
          <div>
            <Button asChild>
              <Link href="/selector">
                Open algorithm studio <ArrowUpRight size={17} />
              </Link>
            </Button>
            <Link className="hero-text-link" href="/complexity">
              Explore the theory
            </Link>
          </div>
        </div>
        <div className="hero-lab">
          <div className="hero-lab-header">
            <span>
              <i /> YOUR INPUT → VISIBLE STEPS
            </span>
            <small>
              {format(w.input.data.length)}{" "}
              {typeof w.input.data[0] === "string" ? "TEXT VALUES" : "INTEGERS"}
            </small>
          </div>
          {w.input.data.length ? (
            <DatasetBars data={w.input.data} />
          ) : (
            <div className="data-empty-art">
              <FileInput size={44} />
              <p>Your values. Every step explained.</p>
              <Link href="/selector">Paste or upload data →</Link>
            </div>
          )}
          <div className="hero-flow">
            <span>DATA PROFILE</span>
            <i />
            <div className="engine-chip">
              <GitBranch size={24} />
            </div>
            <i />
            <span>BEST FIT</span>
          </div>
          <div className="hero-choice">
            <span>
              <small>RECOMMENDED FOR THIS INPUT</small>
              <strong>{top?.name || "Add your data to begin"}</strong>
            </span>
            <b>
              {top ? format(top.score, 0) : "—"}
              <small> / 100</small>
            </b>
          </div>
          <div className="hero-lab-footer">
            <span>40% complexity</span>
            <span>30% dataset fit</span>
            <span>30% memory + history</span>
          </div>
        </div>
      </section>
      <div className="story-strip">
        {[
          { n: "01", title: "Analyze", text: "Read the shape of your data" },
          { n: "02", title: "Decide", text: "Score, select, and explain" },
          { n: "03", title: "Validate", text: "Benchmark the prediction" },
          { n: "04", title: "Adapt", text: "Learn from real evidence" },
        ].map((x) => (
          <div key={x.n}>
            <span>{x.n}</span>
            <div>
              <b>{x.title}</b>
              <p>{x.text}</p>
            </div>
            <ArrowUpRight size={18} />
          </div>
        ))}
      </div>
      <SectionHeading
        title="Pick a problem. Find its best fit."
        detail="Three domains, one decision framework"
      />
      <div className="domain-cards">
        {[
          {
            id: "sorting" as const,
            title: "Sorting",
            icon: ArrowDownWideNarrow,
            text: "Order is more than n log n.",
            sub: "6 algorithms · stability · inversions",
            href: "/selector",
            tag: "START HERE",
          },
          {
            id: "searching" as const,
            title: "Searching",
            icon: Search,
            text: "One lookup or a thousand?",
            sub: "3 algorithms · queries · preprocessing",
            href: "/selector",
            tag: "LOOK DEEPER",
          },
          {
            id: "graph" as const,
            title: "Graphs",
            icon: Network,
            text: "Find a path through complexity.",
            sub: "5 algorithms · paths · traversal",
            href: "/graph",
            tag: "CONNECT THE DOTS",
          },
        ].map(({ id, title, icon: Icon, text, sub, href, tag }) => (
          <Link
            key={id}
            href={href}
            className={`domain-card ${id}`}
            onClick={(e) => {
              if (w.running) {
                e.preventDefault();
                return;
              }
              w.setDomain(id);
            }}
          >
            <div>
              <span className="domain-icon">
                <Icon size={23} />
              </span>
              <span className="domain-tag">{tag}</span>
              <ArrowUpRight size={19} />
            </div>
            <h3>{title}</h3>
            <p>{text}</p>
            <small>{sub}</small>
          </Link>
        ))}
      </div>
      <div className="dashboard-lower">
        <section className="card">
          <SectionHeading title="Your experiment notebook">
            <Link className="text-link" href="/history">
              View history <ArrowUpRight size={15} />
            </Link>
          </SectionHeading>
          {w.history.items.length ? (
            <div className="recent-list">
              {w.history.items.slice(0, 4).map((e) => (
                <Link href="/history" key={e.id}>
                  <span className="recent-icon">
                    <FlaskConical size={17} />
                  </span>
                  <div>
                    <strong>{names[e.selected]}</strong>
                    <small>
                      {e.domain} · {format(e.profile.n)}{" "}
                      {e.domain === "graph" ? "nodes" : "elements"}
                    </small>
                  </div>
                  <span
                    className={`badge ${e.matched ? "badge-green" : "badge-neutral"}`}
                  >
                    {e.matched
                      ? "Prediction matched"
                      : e.winner
                        ? "New evidence"
                        : "Incomplete"}
                  </span>
                  <span>{format(e.selected_ms, 3)} ms</span>
                </Link>
              ))}
            </div>
          ) : (
            <Empty
              title="A clean slate. A good hypothesis."
              description="Run your first benchmark to start a real experiment history."
            >
              <Button variant="outline" asChild>
                <Link href="/benchmark">Run an experiment</Link>
              </Button>
            </Empty>
          )}
        </section>
        <section className="stats-stack">
          <div>
            <span>
              <FlaskConical size={17} /> Experiments recorded
            </span>
            <strong>{s.experiments.toString().padStart(2, "0")}</strong>
          </div>
          <div>
            <span>
              <Target size={17} /> Selection accuracy
            </span>
            <strong>{percent(s.accuracy)}</strong>
            <small>
              {s.evaluated
                ? `Across ${s.evaluated} evaluated predictions`
                : "Available after your first benchmark"}
            </small>
          </div>
          <div>
            <span>
              <Zap size={17} /> Baseline comparison
            </span>
            <strong>
              {s.baseline_speedup ? `${format(s.baseline_speedup)}×` : "—"}
            </strong>
            <small>Aggregate baseline time ÷ selected time</small>
          </div>
        </section>
      </div>
      <div className="bottom-note">
        <Activity size={16} /> No universal winner. No hidden model. Just
        algorithms, evidence, and a decision you can defend.
      </div>
    </>
  );
}
