"use client";
import { useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import type { Edge } from "@/types";
export function GraphCanvas({
  nodes,
  edges,
  directed,
  path,
  onSelect,
}: {
  nodes: string[];
  edges: Edge[];
  directed: boolean;
  path: string[];
  onSelect: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null),
    graph = useRef<cytoscape.Core | null>(null),
    callback = useRef(onSelect);
  useEffect(() => {
    callback.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    if (!container.current) return;
    const cy = cytoscape({
      container: container.current,
      elements: [
        ...nodes.map((id) => ({ data: { id, label: id } })),
        ...edges.map((e, i) => ({
          data: {
            id: `edge-${i}`,
            source: e.source,
            target: e.target,
            label: String(e.weight),
          },
        })),
      ],
      layout: { name: "circle", padding: 58 },
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#f9faf7",
            "border-color": "#4b6570",
            "border-width": 2,
            label: "data(label)",
            color: "#273c47",
            "font-size": 15,
            "font-family": "Arial",
            "font-weight": "bold",
            "text-valign": "center",
            "text-halign": "center",
            width: 44,
            height: 44,
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#b5c2c8",
            "target-arrow-color": "#b5c2c8",
            "target-arrow-shape": directed ? "triangle" : "none",
            "curve-style": "bezier",
            label: "data(label)",
            "font-size": 12,
            color: "#5b6a73",
            "text-background-color": "#f7f9f7",
            "text-background-opacity": 1,
            "text-background-padding": "4px",
            "text-rotation": "autorotate",
          },
        },
        {
          selector: ".highlighted",
          style: {
            "background-color": "#eb673e",
            "border-color": "#d9592e",
            color: "#ffffff",
            "line-color": "#eb673e",
            "target-arrow-color": "#eb673e",
            width: 4,
          },
        },
        { selector: "node.highlighted", style: { width: 46, height: 46 } },
        { selector: "edge.highlighted", style: { color: "#a64f2f" } },
      ],
      minZoom: 0.4,
      maxZoom: 2,
    });
    cy.on("tap", "node", (event) => callback.current(event.target.id()));
    graph.current = cy;
    const observer = new ResizeObserver(() => {
      cy.resize();
      cy.fit(undefined, 50);
    });
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      cy.destroy();
      graph.current = null;
    };
  }, [nodes, edges, directed]);
  useEffect(() => {
    const cy = graph.current;
    if (!cy) return;
    cy.elements().removeClass("highlighted");
    path.forEach((id) => cy.getElementById(id).addClass("highlighted"));
    for (let i = 1; i < path.length; i++) {
      cy.edges()
        .filter(
          (e) =>
            (e.source().id() === path[i - 1] && e.target().id() === path[i]) ||
            (!directed &&
              e.target().id() === path[i - 1] &&
              e.source().id() === path[i]),
        )
        .addClass("highlighted");
    }
  }, [path, directed, nodes, edges]);
  return (
    <div
      ref={container}
      className="graph-canvas"
      role="img"
      aria-label="Interactive graph. Drag nodes to rearrange; choose a target below or click a node to inspect its measured path."
    />
  );
}
