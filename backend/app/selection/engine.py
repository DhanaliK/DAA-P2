from math import ceil, log2

from app.complexity.catalog import CATALOG
from app.core.config import WEIGHTS
from app.history.store import evidence
from app.profiling.profiler import profile_data, profile_graph
from app.schemas.requests import ExperimentInput


def select(domain: str, req: ExperimentInput, use_history: bool = True) -> dict:
    p = profile_graph(req) if domain == "graph" else profile_data(req.data)
    if domain == "searching":
        p.update(
            query_count=len(req.queries),
            updates=req.updates,
            allow_preprocessing=req.allow_preprocessing,
        )
    hist, sample_count = evidence(domain, p) if use_history else ({}, 0)
    n = max(1, p["n"])
    lg = max(1, log2(n))
    k = p.get("range") or 0
    candidates = []
    for key, meta in CATALOG.items():
        if meta["domain"] != domain:
            continue
        eligible, reasons, exclusions = True, [], []
        cost, fit, memory = n * lg, 0.7, 0.8
        if domain == "sorting":
            reasons.append(
                f"{p['n']:,} values; {p['sortedness']:.1%} adjacent order; {p['inversions']:,} exact inversions."
            )
            cost = {
                "insertion": n + p["inversions"],
                "merge": n * lg,
                "quick": n * lg * (1 - 0.6 * p["duplicate_ratio"]),
                "heap": 2 * n * lg,
                "counting": n + k,
                "radix": max(1, ceil(log2(max(1, k)) / 8)) * (n + 256),
            }[key]
            fit = {
                "insertion": max(0.05, 1 - p["inversions"] / max(1, n * lg)),
                "merge": 0.86,
                "quick": 0.85 + 0.1 * p["duplicate_ratio"],
                "heap": 0.62,
                "counting": max(0.1, 1 - k / (max(1, n) * 16)),
                "radix": 0.8 if n >= 512 else 0.45,
            }[key]
            memory = {
                "insertion": 1,
                "merge": 0.55,
                "quick": 0.92,
                "heap": 1,
                "counting": 0.45,
                "radix": 0.5,
            }[key]
            if p.get("data_type") == "text":
                reasons.append(
                    "Text uses case-sensitive Unicode lexicographic order. Work estimates count value comparisons; a comparison can inspect up to L characters."
                )
                if key in ("counting", "radix"):
                    exclusions.append(
                        "This Counting/Radix implementation requires integer keys; choose a comparison sort for text."
                    )
            if key == "counting" and (k > 200000 or k > max(256, 32 * n)):
                exclusions.append(
                    f"Range k={k:,} exceeds the 200,000-bucket or 32n allocation guard (minimum allowance 256)."
                )
            if req.stable and not meta["stable"]:
                exclusions.append("Stable ordering is required; this implementation is unstable.")
            if req.memory == "limited" and key in ("counting", "merge", "radix"):
                exclusions.append("Limited-memory mode excludes linear auxiliary arrays.")
            reasons.append(f"Estimated relative work: {cost:,.0f}; {meta['notes']}")
        elif domain == "searching":
            q = len(req.queries)
            ordered = p["inversions"] == 0
            cost = {
                "linear": max(1, q * n / 2),
                "binary": max(1, q * lg + (0 if ordered else n * lg)),
                "hash": n + q,
            }[key]
            fit = {
                "linear": 1 if q <= 2 else 0.35,
                "binary": 0.95 if ordered else 0.65,
                "hash": 0.95 if q > lg else 0.4,
            }[key]
            memory = {"linear": 1, "binary": 1 if ordered else 0.5, "hash": 0.4}[key]
            if key == "binary" and not ordered and not req.allow_preprocessing:
                exclusions.append(
                    "Input is unsorted. Enable sort preprocessing to make Binary Search applicable."
                )
            if req.memory == "limited" and (key == "hash" or (key == "binary" and not ordered)):
                exclusions.append(
                    "Limited-memory mode excludes index construction / sorting buffers."
                )
            if req.updates:
                fit *= {"linear": 1, "binary": 0.4, "hash": 0.7}[key]
                reasons.append(
                    f"{req.updates} expected updates reduce ordered/indexed structure fit. Timings measure the current immutable query batch, not updates."
                )
            reasons.append(
                f"{q} membership queries across {p['n']} values. "
                + (
                    "Merge Sort preprocessing is included in timing."
                    if key == "binary" and not ordered
                    else "Hash index construction is included in timing."
                    if key == "hash"
                    else "No preprocessing required."
                )
            )
            reasons.append(meta["notes"])
            if p.get("data_type") == "text":
                reasons.append(
                    "Exact, case-sensitive text matching. Comparisons and hashing may inspect multiple characters; estimates are relative value-level work."
                )
        else:
            e = p["edges"]
            task = req.task
            cost = {
                "bfs": n + e,
                "dfs": n + e,
                "dijkstra": (n + e) * lg,
                "bellman": n * max(1, e),
                "floyd": n**3,
            }[key]
            fit = {
                "bfs": 0.95,
                "dfs": 0.9,
                "dijkstra": 0.95,
                "bellman": 0.98 if p["negative_edges"] else 0.55,
                "floyd": 0.95,
            }[key]
            memory = 0.4 if key == "floyd" else 0.8
            if task == "traversal" and key not in ("bfs", "dfs"):
                exclusions.append("Task is traversal; only BFS and DFS are candidates.")
            if task == "single-source" and key not in ("bfs", "dijkstra", "bellman"):
                exclusions.append(
                    "This algorithm does not match the single-source shortest-path task."
                )
            if task == "all-pairs" and key != "floyd":
                exclusions.append("All-pairs task requires an all-pairs implementation.")
            if key == "bfs" and task != "traversal" and p["weighted"]:
                exclusions.append("BFS shortest paths require every edge weight to be 1.")
            if key == "dijkstra" and p["negative_edges"]:
                exclusions.append(
                    f"{p['negative_edges']} negative edges violate Dijkstra's non-negative-weight requirement."
                )
            reasons.append(
                f"{p['vertices']} vertices, {e} edges; density {p['density']:.1%}; task: {task}."
            )
            reasons.append(meta["notes"])
        eligible = not exclusions
        historical = hist.get(key, {"score": 0.5, "samples": 0})
        reasons.append(
            f"History uses {historical['samples']} similar experiments."
            if historical["samples"]
            else "No matching history yet; historical score starts at a neutral 50%."
        )
        candidates.append(
            {
                "id": key,
                "name": meta["name"],
                "eligible": eligible,
                "reasons": reasons,
                "exclusions": exclusions,
                "estimated_work": cost,
                "components": {
                    "complexity": 0,
                    "fit": fit,
                    "memory": memory,
                    "history": historical["score"],
                },
                "history_samples": historical["samples"],
                "metadata": meta,
                "score": 0,
            }
        )
    minimum = min((c["estimated_work"] for c in candidates if c["eligible"]), default=1)
    for c in candidates:
        c["components"]["complexity"] = (minimum / max(1, c["estimated_work"])) ** 0.5
        c["components"]["complexity"] = min(1, c["components"]["complexity"])
        if c["eligible"]:
            c["score"] = round(100 * sum(WEIGHTS[k] * v for k, v in c["components"].items()), 2)
    candidates.sort(key=lambda c: c["score"], reverse=True)
    recommended = next((c["id"] for c in candidates if c["eligible"]), None)
    return {
        "domain": domain,
        "profile": p,
        "candidates": candidates,
        "recommended": recommended,
        "weights": WEIGHTS,
        "similar_experiments": sample_count,
        "note": "Suitability scores are transparent heuristics, not probabilities or measured runtimes.",
    }
