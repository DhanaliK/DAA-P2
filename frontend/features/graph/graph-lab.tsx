"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Play, Upload, Network, Check, MousePointer2 } from "lucide-react";
import { useWorkspace } from "@/hooks/workspace";
import {
  PageHeading,
  ProfileMetrics,
  SectionHeading,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Visualizer } from "@/features/visualizer/visualizer";
import { GraphCanvas } from "./graph-canvas";
import { Recommendation } from "@/features/selector/recommendation";
import type { Edge, GraphOutput } from "@/types";
import { names } from "@/lib/api";
export function GraphLab() {
  const w = useWorkspace();
  const [edgeText, setEdgeText] = useState(
      "source,target,weight\n" +
        w.input.edges
          .map((e) => `${e.source},${e.target},${e.weight}`)
          .join("\n"),
    ),
    [nodeText, setNodeText] = useState(w.input.nodes.join(", ")),
    [target, setTarget] = useState(w.input.nodes.at(-1) || ""),
    [editor, setEditor] = useState(!w.input.nodes.length);
  const file = useRef<HTMLInputElement>(null);
  const result = w.job?.results.find(
      (r) => r.algorithm === w.selection?.recommended && r.status === "ok",
    ),
    output = result?.output as GraphOutput | undefined;
  const load = (text: string) => {
    try {
      const lines = text.trim().split(/\r?\n/).filter(Boolean);
      if (
        lines[0]?.toLowerCase().replaceAll(" ", "") === "source,target,weight"
      )
        lines.shift();
      const edges: Edge[] = lines.map((line, index) => {
        const parts = line.split(",").map((x) => x.trim());
        if (
          parts.length !== 3 ||
          !parts[0] ||
          !parts[1] ||
          !parts[2] ||
          !Number.isSafeInteger(Number(parts[2]))
        )
          throw new Error(
            `Invalid edge on row ${index + 1}. Use source,target,integer weight.`,
          );
        return { source: parts[0], target: parts[1], weight: Number(parts[2]) };
      });
      const nodes = [
        ...new Set([
          ...nodeText
            .split(",")
            .map((n) => n.trim())
            .filter(Boolean),
          ...edges.flatMap((e) => [e.source, e.target]),
        ]),
      ];
      if (!nodes.length)
        throw new Error("Paste or upload edges, or enter at least one node.");
      setTarget(nodes.at(-1) || "");
      w.changeInput(
        {
          ...w.input,
          nodes,
          edges,
          source: nodes.includes(w.input.source)
            ? w.input.source
            : nodes[0] || "A",
        },
        "graph",
      );
      setEditor(false);
    } catch (e) {
      w.setError((e as Error).message);
    }
  };
  const path: string[] = [];
  if (output && !output.negative_cycle && output.distances?.[target] != null) {
    let v = target;
    const seen = new Set<string>();
    while (v && !seen.has(v)) {
      path.unshift(v);
      seen.add(v);
      v = output.parents?.[v] || "";
    }
    if (path[0] !== w.input.source) path.length = 0;
  }
  return (
    <>
      <PageHeading
        eyebrow="A DIFFERENT KIND OF INPUT"
        title="Every connection changes the decision."
        description="Explore how edge weights, density, and the task determine which graph algorithm fits."
        action={
          <Button variant="outline" onClick={() => setEditor(!editor)}>
            <Upload size={16} /> Edit / upload graph
          </Button>
        }
      />
      {w.domain !== "graph" ? (
        <div className="card switch-card">
          <h2>Open the graph workspace</h2>
          <p>Your graph input is ready. Switch domains to analyze it.</p>
          <Button disabled={w.running} onClick={() => w.setDomain("graph")}>
            Analyze graph
          </Button>
        </div>
      ) : (
        <>
          <div className="graph-controls card">
            <fieldset disabled={w.running || w.busy}>
              <label>
                Graph task
                <select
                  value={w.input.task}
                  onChange={(e) =>
                    w.changeInput({
                      ...w.input,
                      task: e.target.value as typeof w.input.task,
                    })
                  }
                >
                  <option value="single-source">
                    Single-source shortest path
                  </option>
                  <option value="traversal">Traversal / reachability</option>
                  <option value="all-pairs">All-pairs shortest paths</option>
                </select>
              </label>
              <label>
                Start node
                <select
                  value={w.input.source}
                  onChange={(e) =>
                    w.changeInput({ ...w.input, source: e.target.value })
                  }
                >
                  {w.input.nodes.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={w.input.directed}
                  onChange={(e) =>
                    w.changeInput({ ...w.input, directed: e.target.checked })
                  }
                />{" "}
                Directed
              </label>
            </fieldset>
          </div>
          {editor && (
            <section className="card graph-editor">
              <p className="input-help">
                Paste your connections as source,target,weight, one edge per
                line, or upload a CSV. Node labels are inferred from edges; add
                isolated nodes separately.
              </p>
              <fieldset disabled={w.running || w.busy}>
                <label>
                  Node labels (includes isolated nodes)
                  <input
                    value={nodeText}
                    onChange={(e) => {
                      setNodeText(e.target.value);
                      w.setInputPending(true);
                    }}
                  />
                </label>
                <label>
                  Edge list · source,target,weight
                  <textarea
                    value={edgeText}
                    onChange={(e) => {
                      setEdgeText(e.target.value);
                      w.setInputPending(true);
                    }}
                    rows={7}
                  />
                </label>
                <div>
                  <Button onClick={() => load(edgeText)}>Apply graph</Button>
                  <Button
                    variant="outline"
                    onClick={() => file.current?.click()}
                  >
                    Upload edge CSV
                  </Button>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    ref={file}
                    hidden
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        if (f.size > 1024 * 1024) {
                          w.setError("Graph files must be under 1 MB.");
                          return;
                        }
                        const text = await f.text();
                        setEdgeText(text);
                        load(text);
                      }
                      e.target.value = "";
                    }}
                  />
                </div>
              </fieldset>
            </section>
          )}
          <Visualizer />
          <div className="graph-layout">
            <div>
              <section className="card graph-surface">
                <SectionHeading
                  title="Your graph, connected"
                  detail={`${w.input.nodes.length} NODES · ${w.input.edges.length} EDGES`}
                >
                  <Network size={18} />
                </SectionHeading>
                <GraphCanvas
                  nodes={w.input.nodes}
                  edges={w.input.edges}
                  directed={w.input.directed}
                  path={path}
                  onSelect={setTarget}
                />
                <div className="graph-legend">
                  <span>
                    <i /> Unvisited connection
                  </span>
                  <span>
                    <i className="highlight" /> Measured path
                  </span>
                  <span>
                    <MousePointer2 size={13} /> Drag nodes · scroll to zoom
                  </span>
                </div>
                {w.selection && (
                  <ProfileMetrics profile={w.selection.profile} />
                )}
              </section>
              <section className="card path-card">
                <SectionHeading
                  title={
                    w.input.task === "traversal"
                      ? "Traversal result"
                      : "Follow the path"
                  }
                />
                <div className="path-controls">
                  <label>
                    Inspect target
                    <select
                      value={w.input.nodes.includes(target) ? target : ""}
                      onChange={(e) => setTarget(e.target.value)}
                    >
                      <option value="" disabled>
                        Select a node
                      </option>
                      {w.input.nodes.map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </label>
                  <Button
                    disabled={
                      w.running || w.busy || !w.selection || w.inputPending
                    }
                    onClick={w.runBenchmark}
                  >
                    <Play size={14} />
                    {w.running
                      ? `Running ${w.job?.current || "workers"}…`
                      : "Execute & compare"}
                  </Button>
                </div>
                {output?.negative_cycle ? (
                  <p className="text-error">
                    A negative cycle was detected. Finite shortest paths are not
                    defined for the affected task.
                  </p>
                ) : output?.all_pairs ? (
                  <>
                    <p>All-pairs distances. ∞ means unreachable.</p>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>From / to</th>
                            {w.input.nodes.map((n) => (
                              <th key={n}>{n}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(output.all_pairs).map(([u, row]) => (
                            <tr key={u}>
                              <th>{u}</th>
                              {w.input.nodes.map((v) => (
                                <td key={v}>{row[v] ?? "∞"}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : output ? (
                  <>
                    <div className="path-trace">
                      {(w.input.task === "traversal"
                        ? output.order || []
                        : path
                      ).map((n, i) => (
                        <span key={`${n}-${i}`}>
                          {i > 0 && <i>→</i>}
                          <b>{n}</b>
                        </span>
                      ))}
                    </div>
                    <p>
                      {w.input.task === "traversal"
                        ? "Visit order from the selected source; disconnected vertices are not visited."
                        : output.distances?.[target] == null
                          ? "The target is unreachable from the source."
                          : `Distance from ${w.input.source} to ${target}: ${output.distances[target]}`}
                    </p>
                    <span className="badge badge-green">
                      <Check size={12} /> {names[result!.algorithm]} · verified
                      execution
                    </span>
                  </>
                ) : (
                  <p>
                    Execute the graph to see real distances and a highlighted
                    path. No path is simulated.
                  </p>
                )}
                {w.job && (
                  <Link href="/benchmark" className="text-link">
                    View complete comparison
                  </Link>
                )}
              </section>
            </div>
            <div className="decision-column">
              <Recommendation />
            </div>
          </div>
        </>
      )}
    </>
  );
}
