"use client";
import { useEffect, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  ArrowRight,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/hooks/workspace";
import { api, names } from "@/lib/api";
import type { DataValue, Domain, Input } from "@/types";
type Frame = {
  message: string;
  phase: string;
  array: (DataValue | null)[];
  active: number[];
  query?: DataValue;
  variables?: Record<string, number | string>;
  results?: boolean[];
  current?: string;
  edge?: string[];
  visited: string[];
  frontier?: string[];
  distances: Record<string, number | null>;
  matrix?: Record<string, Record<string, number | null>>;
};
type Trace = {
  algorithm: string;
  frames: Frame[];
  correct: boolean;
  omitted: number;
  output: unknown;
  metrics: Record<string, number>;
};
export function Visualizer() {
  const w = useWorkspace(),
    [chosen, setChosen] = useState("");
  const candidates = w.selection?.candidates.filter((c) => c.eligible) || [];
  const algorithm = candidates.some((c) => c.id === chosen)
    ? chosen
    : w.selection?.recommended || "";
  if (!w.selection || w.inputPending)
    return (
      <section className="visualizer-empty">
        <ScanLine size={24} />
        <div>
          <strong>Your data becomes an animation here</strong>
          <p>
            Paste or upload input and analyze it. Then watch each comparison,
            move, or graph visit.
          </p>
        </div>
      </section>
    );
  return (
    <section
      id="visual-playback"
      className="card visualizer"
      aria-label="Algorithm visualizer"
    >
      <div className="visualizer-heading">
        <div>
          <span className="eyebrow">02 · WATCH YOUR DATA MOVE</span>
          <h2>See the algorithm think.</h2>
          <p>
            Recorded steps from the same implementation used in Benchmark lab.
          </p>
        </div>
        <label>
          Visualize algorithm
          <select value={algorithm} onChange={(e) => setChosen(e.target.value)}>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.id === w.selection?.recommended ? " · recommended" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Playback
        key={JSON.stringify([w.domain, algorithm, w.input])}
        domain={w.domain}
        algorithm={algorithm}
        input={w.input}
      />
    </section>
  );
}
function Playback({
  domain,
  algorithm,
  input,
}: {
  domain: Domain;
  algorithm: string;
  input: Input;
}) {
  const [trace, setTrace] = useState<Trace | null>(null),
    [error, setError] = useState(""),
    [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(600);
  const limit =
    domain === "graph"
      ? input.nodes.length > 16 || input.edges.length > 60
        ? "Visual playback supports 1–16 nodes and up to 60 edges."
        : ""
      : input.data.length > 80
        ? "Visual playback supports 1–80 values. Nothing is silently sampled."
        : domain === "searching" && input.queries.length > 8
          ? "Visual searching supports up to 8 targets at a time."
          : "";
  useEffect(() => {
    if (limit) return;
    let live = true;
    api<Trace>(`/${domain}/trace/${algorithm}`, input)
      .then((t) => {
        if (live) setTrace(t);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [domain, algorithm, input, limit]);
  useEffect(() => {
    if (!playing || !trace) return;
    const timer = setTimeout(() => {
      if (index >= trace.frames.length - 1) {
        setPlaying(false);
      } else {
        setIndex(index + 1);
      }
    }, speed);
    return () => clearTimeout(timer);
  }, [playing, index, speed, trace]);
  if (error || limit)
    return (
      <div className="trace-unavailable" role="status">
        <strong>Visual playback unavailable</strong>
        <p>{limit || error}</p>
        <p>
          Your complete input is still available for analysis and benchmarking.
        </p>
      </div>
    );
  if (!trace)
    return (
      <div className="trace-loading" role="status">
        Recording {names[algorithm]} on your input…
      </div>
    );
  const frame = trace.frames[index],
    last = index === trace.frames.length - 1;
  const move = (i: number) => {
    setPlaying(false);
    setIndex(i);
  };
  return (
    <>
      <div className="trace-toolbar">
        <Button
          aria-label={playing ? "Pause animation" : "Play animation"}
          onClick={() => {
            if (last) setIndex(0);
            setPlaying(!playing);
          }}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
          {playing ? "Pause" : "Play"}
        </Button>
        <Button
          variant="outline"
          aria-label="Previous step"
          disabled={!index}
          onClick={() => move(index - 1)}
        >
          <SkipBack size={16} />
        </Button>
        <Button
          variant="outline"
          aria-label="Next step"
          disabled={last}
          onClick={() => move(index + 1)}
        >
          <SkipForward size={16} />
        </Button>
        <Button
          variant="ghost"
          aria-label="Restart animation"
          onClick={() => move(0)}
        >
          <RotateCcw size={16} />
        </Button>
        <label>
          Playback speed
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            <option value={1200}>Slow · 0.5×</option>
            <option value={600}>Normal · 1×</option>
            <option value={200}>Fast · 3×</option>
          </select>
        </label>
        <span className="trace-position">
          Step {index + 1} / {trace.frames.length}
        </span>
      </div>
      <div className="trace-stage">
        {domain === "graph" ? (
          <GraphStep input={input} frame={frame} />
        ) : (
          <ArrayStep frame={frame} complete={last && domain === "sorting"} />
        )}
      </div>
      <div className="trace-explanation" aria-live="polite">
        <span className={`phase-chip ${last ? "complete" : ""}`}>
          {frame.phase}
        </span>
        <p>{frame.message}</p>
        {frame.query !== undefined && <b>Target: {frame.query}</b>}
      </div>
      {!!frame.variables && Object.keys(frame.variables).length > 0 && (
        <div className="trace-variables">
          {Object.entries(frame.variables).map(([key, v]) => (
            <span key={key}>
              {key} <b>{v}</b>
            </span>
          ))}
        </div>
      )}
      {domain === "graph" && frame.frontier && (
        <div className="trace-variables">
          <span>{algorithm === "dfs" ? "Stack" : "Frontier"}</span>
          {frame.frontier.length ? (
            frame.frontier.map((v, i) => <b key={i}>{v}</b>)
          ) : (
            <b>Empty</b>
          )}
        </div>
      )}
      {frame.matrix && Object.keys(frame.matrix).length > 0 && (
        <div className="trace-matrix table-scroll">
          <table>
            <caption>Current distances · ∞ means no known path</caption>
            <thead>
              <tr>
                <th>From / to</th>
                {input.nodes.map((n) => (
                  <th key={n}>{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {input.nodes.map((n) => (
                <tr key={n}>
                  <th>{n}</th>
                  {input.nodes.map((v) => (
                    <td key={v}>{frame.matrix?.[n]?.[v] ?? "∞"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {domain === "searching" && frame.results && (
        <div className="trace-query-results">
          {frame.results.map((found, i) => (
            <span className={found ? "found" : "missing"} key={i}>
              {input.queries[i]} <ArrowRight size={13} />{" "}
              {found ? "Found" : "Not found"}
            </span>
          ))}
        </div>
      )}
      <label className="trace-scrubber">
        Jump to a step
        <input
          type="range"
          min={0}
          max={trace.frames.length - 1}
          value={index}
          onChange={(e) => move(Number(e.target.value))}
        />
      </label>
      <div className="trace-footer">
        <span>
          <i className="active-dot" /> Active comparison / move{" "}
          <i className="visited-dot" /> Visited / complete
        </span>
        <span>
          {last
            ? trace.correct
              ? "Completed output verified"
              : "Output verification failed"
            : "Playback speed is for learning; use Benchmark lab for measured time."}
        </span>
      </div>
      {!!trace.omitted && (
        <p className="note-box">
          {trace.omitted} intermediate steps were omitted to keep playback
          bounded. The final frame shows the complete verified output.
        </p>
      )}
    </>
  );
}
function ArrayStep({ frame, complete }: { frame: Frame; complete: boolean }) {
  const values = frame.array || [],
    numeric = values.filter((v): v is number => typeof v === "number"),
    min = Math.min(...numeric, 0),
    max = Math.max(...numeric, 1);
  if (values.some((v) => typeof v === "string"))
    return (
      <div className="trace-scroll">
        <div
          className="text-values trace-text"
          aria-label="Text execution step"
        >
          {values.map((value, i) => (
            <span
              key={i}
              className={`${frame.active?.includes(i) ? "active" : ""} ${complete ? "done" : ""}`}
              title={String(value ?? "Empty slot")}
            >
              <small>Position {i}</small>
              <code>{value === null ? "·" : JSON.stringify(value)}</code>
            </span>
          ))}
        </div>
        <span className="trace-axis">
          Case-sensitive Unicode order · highlighted values are being compared
          or moved
        </span>
      </div>
    );
  return (
    <div className="trace-scroll">
      <div
        className="trace-bars"
        style={{ minWidth: Math.max(0, values.length * 43) }}
      >
        {values.length ? (
          values.map((v, i) => (
            <div
              className={`trace-cell ${frame.active?.includes(i) ? "active" : ""} ${complete ? "done" : ""}`}
              key={i}
            >
              <span className="trace-value">{v ?? "·"}</span>
              <div
                style={{
                  height:
                    typeof v !== "number"
                      ? 8
                      : 24 + ((v - min) / Math.max(1, max - min)) * 130,
                }}
              />
              <small>{i}</small>
            </div>
          ))
        ) : (
          <p className="empty-bucket">
            This bucket is empty. No values to compare.
          </p>
        )}
      </div>
      <span className="trace-axis">
        Array positions (zero-based) · values are shown above each bar
      </span>
    </div>
  );
}
function GraphStep({ input, frame }: { input: Input; frame: Frame }) {
  const positions = Object.fromEntries(
    input.nodes.map((n, i) => {
      const a = (2 * Math.PI * i) / input.nodes.length - Math.PI / 2;
      return [n, { x: 400 + 280 * Math.cos(a), y: 185 + 130 * Math.sin(a) }];
    }),
  );
  return (
    <svg
      className="trace-graph"
      viewBox="0 0 800 380"
      role="img"
      aria-label={`Graph execution step: ${frame.message}`}
    >
      <defs>
        <marker
          id="trace-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L8,3 z" fill="#98abae" />
        </marker>
      </defs>
      {input.edges.map((e, i) => {
        const a = positions[e.source],
          b = positions[e.target],
          dx = b.x - a.x,
          dy = b.y - a.y,
          len = Math.max(1, Math.hypot(dx, dy));
        const active =
          (frame.edge?.[0] === e.source && frame.edge?.[1] === e.target) ||
          (!input.directed &&
            frame.edge?.[1] === e.source &&
            frame.edge?.[0] === e.target);
        return (
          <g key={i} className={active ? "edge-active" : ""}>
            {e.source === e.target ? (
              <path
                d={`M${a.x - 14},${a.y - 16} C${a.x - 70},${a.y - 80} ${a.x + 70},${a.y - 80} ${a.x + 14},${a.y - 16}`}
                fill="none"
                stroke="#98abae"
                markerEnd={input.directed ? "url(#trace-arrow)" : undefined}
              />
            ) : (
              <line
                x1={a.x + (dx / len) * 23}
                y1={a.y + (dy / len) * 23}
                x2={b.x - (dx / len) * 27}
                y2={b.y - (dy / len) * 27}
                markerEnd={input.directed ? "url(#trace-arrow)" : undefined}
              />
            )}
            <text
              x={(a.x + b.x) / 2 + 8}
              y={e.source === e.target ? a.y - 50 : (a.y + b.y) / 2 - 8}
            >
              {e.weight}
            </text>
          </g>
        );
      })}
      {input.nodes.map((n) => (
        <g
          key={n}
          transform={`translate(${positions[n].x},${positions[n].y})`}
          className={`trace-node ${frame.visited?.includes(n) ? "visited" : ""} ${frame.current === n ? "current" : ""}`}
        >
          <title>{n}</title>
          <circle r="23" />
          <text textAnchor="middle" dy="5">
            {n.length > 6 ? n.slice(0, 5) + "…" : n}
          </text>
          <text className="node-distance" textAnchor="middle" y="42">
            {frame.matrix?.[input.source]?.[n] ?? frame.distances?.[n] ?? "∞"}
          </text>
        </g>
      ))}
    </svg>
  );
}
