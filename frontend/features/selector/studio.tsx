"use client";
import Link from "next/link";
import { ArrowDownWideNarrow, Search, Network, BookOpen } from "lucide-react";
import { useWorkspace } from "@/hooks/workspace";
import { PageHeading } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Visualizer } from "@/features/visualizer/visualizer";
import { InputPanel } from "./input-panel";
import { WorkflowGuide } from "@/components/workflow-guide";
import { Recommendation } from "./recommendation";
export function Studio() {
  const w = useWorkspace();
  return (
    <>
      <PageHeading
        eyebrow="THE DECISION WORKSPACE"
        title="Let your data choose the algorithm."
        description="Bring your data. Watch the algorithm work. Compare real performance."
        action={
          <Button variant="outline" asChild>
            <Link href="/complexity">
              <BookOpen size={16} /> Explore complexity
            </Link>
          </Button>
        }
      />
      <WorkflowGuide />
      <div className="domain-tabs" aria-label="Problem domain">
        {[
          {
            id: "sorting" as const,
            name: "Sorting",
            icon: ArrowDownWideNarrow,
          },
          { id: "searching" as const, name: "Searching", icon: Search },
        ].map(({ id, name, icon: Icon }) => (
          <button
            key={id}
            disabled={w.running}
            className={w.domain === id ? "selected" : ""}
            onClick={() => w.setDomain(id)}
          >
            <Icon size={17} />
            {name}
            <small>{id === "sorting" ? "06" : "03"}</small>
          </button>
        ))}
        <Link
          href="/graph"
          onClick={() => {
            if (!w.running) w.setDomain("graph");
          }}
        >
          <Network size={17} /> Graphs <small>05</small>
        </Link>
        <span>One framework. Different problems.</span>
      </div>
      {w.domain === "graph" ? (
        <div className="card switch-card">
          <h2>You are working with a graph.</h2>
          <Button onClick={() => w.setDomain("sorting")} disabled={w.running}>
            Switch to sorting
          </Button>
          <Button asChild variant="outline">
            <Link href="/graph">Open graph explorer</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="studio-grid">
            <div>
              <InputPanel />
              <div className="concept-note">
                <span>WHY THE INPUT MATTERS</span>
                <p>
                  {w.domain === "sorting"
                    ? "An algorithm’s complexity describes growth. Your input determines how much of that growth you actually experience."
                    : "A fast lookup can hide an expensive setup. Compare the complete query batch, including preprocessing."}
                </p>
              </div>
            </div>
            <div className="decision-column">
              <Recommendation />
            </div>
          </div>
          <Visualizer />
        </>
      )}
    </>
  );
}
