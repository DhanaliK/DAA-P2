"""Bounded snapshots captured from the actual benchmark implementations."""

from copy import deepcopy

from app.algorithms.metrics import Metrics
from app.benchmarking.runner import execute, verify
from app.selection.engine import select


def trace_execution(domain, algorithm, req):
    if domain == "graph":
        if not req.nodes or len(req.nodes) > 16 or len(req.edges) > 60:
            raise ValueError(
                "Visual playback supports 1–16 nodes and up to 60 edges. Benchmarking supports larger graphs."
            )
    elif not req.data or len(req.data) > 80:
        raise ValueError(
            "Visual playback supports 1–80 values. All supplied values still participate in analysis and benchmarks; nothing is silently sampled."
        )
    if domain == "searching" and not 1 <= len(req.queries) <= 8:
        raise ValueError("Visual searching needs 1–8 query values.")
    selection = select(domain, req, use_history=False)
    candidate = next((c for c in selection["candidates"] if c["id"] == algorithm), None)
    if not candidate or not candidate["eligible"]:
        raise ValueError("This algorithm is not eligible for the current input and constraints.")
    frames = []
    state = {"array": req.data, "active": [], "visited": [], "distances": {}}
    omitted = 0

    def record(message, **values):
        nonlocal omitted
        state.update(values)
        state["message"] = message
        if "active" not in values:
            state["active"] = []
        if "edge" not in values:
            state["edge"] = []
        if len(frames) < 3999 or values.get("phase") == "complete":
            frames.append(deepcopy(state))
        else:
            omitted += 1

    metrics = Metrics()
    metrics.observer = record
    record("Your submitted input. Press Play or Next step to follow the algorithm.", phase="start")
    payload = req.model_dump()
    output = execute(domain, algorithm, payload, metrics)
    correct = verify(domain, algorithm, payload, output)
    final = {"phase": "complete", "variables": {}, "current": None, "frontier": []}
    if domain == "sorting":
        final["array"] = output
    elif domain == "searching":
        final["results"] = output
    else:
        final["distances"] = output.get("distances", {})
        final["matrix"] = output.get("all_pairs", {})
        final["visited"] = output.get("order", state.get("visited", []))
    message = "Execution complete. Output checked against an independent reference."
    if isinstance(output, dict) and output.get("negative_cycle"):
        message = "Negative cycle detected. Finite shortest paths are undefined."
    record(message, **final)
    return {
        "algorithm": algorithm,
        "frames": frames,
        "output": output,
        "correct": correct,
        "omitted": omitted,
        "metrics": metrics.export(),
    }
