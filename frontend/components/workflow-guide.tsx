"use client";
import Link from "next/link";
import { FileInput, ScanSearch, Timer, ArrowRight } from "lucide-react";
import { useWorkspace } from "@/hooks/workspace";
export function WorkflowGuide({ benchmark = false }: { benchmark?: boolean }) {
  const w = useWorkspace();
  const active = w.inputPending || !w.selection ? 0 : benchmark ? 2 : 1;
  const graph = w.domain === "graph";
  const steps = [
    {
      title: graph ? "Build a graph" : "Enter your data",
      text: graph
        ? "Set vertices, edges, and the graph task."
        : "Type, paste, or upload. Check the values we read.",
      icon: FileInput,
      href: graph ? "/graph" : "/selector",
    },
    {
      title: "Watch it work",
      text: "Play each step. Follow comparisons, moves, and visits.",
      icon: ScanSearch,
      href: graph ? "/graph" : "/selector",
    },
    {
      title: "Run & compare",
      text: "Measure real algorithms. Compare speed and verified output.",
      icon: Timer,
      href: "/benchmark",
    },
  ];
  return (
    <nav className="workflow-guide" aria-label="How to use AlgoAdapt">
      {steps.map((step, i) => (
        <Link
          key={step.title}
          href={step.href}
          className={active === i ? "current" : ""}
          aria-current={active === i ? "step" : undefined}
        >
          <span className="workflow-number">0{i + 1}</span>
          <div>
            <strong>
              <step.icon size={16} />
              {step.title}
            </strong>
            <p>{step.text}</p>
          </div>
          <ArrowRight className="workflow-arrow" size={17} />
        </Link>
      ))}
    </nav>
  );
}
