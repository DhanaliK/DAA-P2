"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  SlidersHorizontal,
  ChartNoAxesCombined,
  FlaskConical,
  Network,
  History,
  CircleHelp,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ScanLine,
  GitBranch,
} from "lucide-react";
import { useState } from "react";
import { useWorkspace } from "@/hooks/workspace";
import { Button } from "./ui/button";
const links = [
  { href: "/", title: "Overview", icon: LayoutDashboard },
  { href: "/selector", title: "Algorithm studio", icon: SlidersHorizontal },
  { href: "/complexity", title: "Complexity lab", icon: ChartNoAxesCombined },
  { href: "/benchmark", title: "Benchmark lab", icon: FlaskConical },
  { href: "/graph", title: "Graph explorer", icon: Network },
  { href: "/explainability", title: "Decision insights", icon: ScanLine },
  { href: "/history", title: "Experiment history", icon: History },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const w = useWorkspace();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={`app-shell ${collapsed ? "collapsed" : ""}`}>
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <GitBranch size={23} />
          </span>
          <span>
            Algo<span className="brand-light">Adapt</span>
            <small>THE ALGORITHM LAB</small>
          </span>
        </Link>
        <div className="nav-label">
          WORKSPACE <span>01</span>
        </div>
        <nav aria-label="Main navigation">
          {links.map(({ href, title, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-label={title}
              aria-current={path === href ? "page" : undefined}
              title={title}
              onClick={() => {
                if (href === "/graph" && w.domain !== "graph" && !w.running)
                  w.setDomain("graph");
                setCollapsed(false);
              }}
              className={`nav-item ${path === href ? "active" : ""}`}
            >
              <Icon size={18} />
              <span>{title}</span>
              {path === href && <i />}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-plain"
              aria-label="Toggle navigation"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <PanelLeftOpen size={19} />
              ) : (
                <PanelLeftClose size={19} />
              )}
            </button>
            <span>Workspace</span>
            <b>/</b>
            <strong>
              {links.find((l) => l.href === path)?.title || "Lab"}
            </strong>
          </div>
          <div className="top-actions">
            <span className={`engine-state ${w.connected ? "online" : ""}`}>
              <i />
              {w.connected ? "Engine connected" : "Connecting to engine"}
            </span>
            <Link href="/complexity" aria-label="Learn about complexity">
              <CircleHelp size={19} />
            </Link>
            <span className="avatar">AA</span>
          </div>
        </header>
        <main>
          {w.error && (
            <div role="alert" className="error-banner">
              <span>{w.error}</span>
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => w.analyze(w.input, w.domain)}
                >
                  Retry connection
                </Button>
                <button
                  aria-label="Dismiss error"
                  onClick={() => w.setError("")}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}
          {children}
        </main>
        <footer>
          <span>
            AlgoAdapt <b>·</b> A decision you can explain.
          </span>
          <span>
            ANALYZE <b>/</b> SELECT <b>/</b> VALIDATE <b>/</b> ADAPT
          </span>
        </footer>
      </div>
    </div>
  );
}
