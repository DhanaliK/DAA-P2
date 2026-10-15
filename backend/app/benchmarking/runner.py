import copy
import multiprocessing as mp
import platform
import statistics
import time
import tracemalloc

from app.algorithms.graph import GRAPH, adjacency
from app.algorithms.metrics import Metrics
from app.algorithms.searching import SEARCHES
from app.algorithms.sorting import SORTS
from app.core.config import TIMEOUT_SECONDS


def execute(domain, algorithm, payload, metrics):
    if domain == "sorting":
        return SORTS[algorithm](payload["data"], metrics)
    if domain == "searching":
        ordered = all(a <= b for a, b in zip(payload["data"], payload["data"][1:]))
        if algorithm == "binary" and not ordered and not payload["allow_preprocessing"]:
            raise ValueError("Binary Search needs sorted input or explicit preprocessing.")
        return SEARCHES[algorithm](
            payload["data"], payload["queries"], metrics, preprocess=not ordered
        )
    return GRAPH[algorithm](
        payload["nodes"], payload["edges"], payload["directed"], payload["source"], metrics
    )


def reference_distances(nodes, adj, source):
    # Synchronous relaxation oracle, separate from timed in-place Bellman-Ford.
    dist = {v: float("inf") for v in nodes}
    if not nodes:
        return {}, False
    dist[source] = 0
    for _ in range(max(0, len(nodes) - 1)):
        nxt = dict(dist)
        for u in nodes:
            for v, w in adj[u]:
                nxt[v] = min(nxt[v], dist[u] + w)
        dist = nxt
    cycle = any(dist[u] + w < dist[v] for u in nodes for v, w in adj[u])
    return {k: None if v == float("inf") else v for k, v in dist.items()}, cycle


def verify(domain, algorithm, payload, output):
    if domain == "sorting":
        return output == sorted(payload["data"])
    if domain == "searching":
        return output == [q in payload["data"] for q in payload["queries"]]
    nodes = payload["nodes"]
    adj = adjacency(nodes, payload["edges"], payload["directed"])
    if payload["task"] == "traversal":
        seen, todo = set(), [payload["source"]] if nodes else []
        while todo:
            u = todo.pop()
            if u in seen:
                continue
            seen.add(u)
            todo.extend(v for v, _ in adj[u])
        order = output.get("order", [])
        return (
            set(order) == seen
            and len(order) == len(seen)
            and (not nodes or order[0] == payload["source"])
        )
    if algorithm == "floyd":
        refs = {u: reference_distances(nodes, adj, u) for u in nodes}
        negative = any(cycle for _, cycle in refs.values())
        return bool(output.get("negative_cycle")) == negative and (
            negative or output.get("all_pairs") == {u: d for u, (d, _) in refs.items()}
        )
    expected, negative = reference_distances(nodes, adj, payload["source"])
    return bool(output.get("negative_cycle")) == negative and (
        negative or output.get("distances") == expected
    )


def worker(connection, domain, algorithm, payload):
    try:
        # A warmup is discarded. Input copying and correctness oracle are outside timing.
        execute(domain, algorithm, copy.deepcopy(payload), Metrics())
        samples, output, metrics = [], None, None
        for _ in range(payload["trials"]):
            data, metrics = copy.deepcopy(payload), Metrics()
            start = time.perf_counter_ns()
            output = execute(domain, algorithm, data, metrics)
            samples.append((time.perf_counter_ns() - start) / 1_000_000)
        valid = verify(domain, algorithm, payload, output)
        memory_input = copy.deepcopy(payload)
        tracemalloc.start()
        memory_output = execute(domain, algorithm, memory_input, Metrics())
        _, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        del memory_output
        # Full correctness is checked before returning a bounded preview.
        result_output = output[:120] if isinstance(output, list) else output
        connection.send(
            {
                "algorithm": algorithm,
                "status": "ok" if valid else "incorrect",
                "correct": valid,
                "runtime_ms": statistics.median(samples),
                "trials_ms": samples,
                "peak_bytes": peak,
                "metrics": metrics.export(),
                "output": result_output,
                "output_truncated": isinstance(output, list) and len(output) > 120,
            }
        )
    except Exception as exc:
        connection.send(
            {"algorithm": algorithm, "status": "error", "error": str(exc), "correct": False}
        )
    finally:
        connection.close()


def isolated(domain, algorithm, payload, cancelled=lambda: False):
    context = mp.get_context("spawn")
    parent, child = context.Pipe(duplex=False)
    process = context.Process(target=worker, args=(child, domain, algorithm, payload), daemon=True)
    started = time.monotonic()
    process.start()
    child.close()
    try:
        while time.monotonic() - started < TIMEOUT_SECONDS:
            if cancelled():
                return {"algorithm": algorithm, "status": "cancelled"}
            if parent.poll(0.05):
                try:
                    return parent.recv()
                except EOFError:
                    return {
                        "algorithm": algorithm,
                        "status": "error",
                        "error": "Worker exited before reporting a result.",
                    }
            if not process.is_alive():
                break
        return {
            "algorithm": algorithm,
            "status": "timeout",
            "error": f"Stopped after {TIMEOUT_SECONDS}s including process startup, warmup, trials, correctness and memory pass.",
        }
    finally:
        if process.is_alive():
            process.terminate()
        process.join(timeout=2)
        parent.close()


def conditions(trials):
    return {
        "trials": trials,
        "statistic": "Median wall time",
        "timer": "perf_counter_ns",
        "warmups": 1,
        "memory": "Separate tracemalloc pass; peak Python allocations, not RSS; excludes input transport copies.",
        "operations": "Instrumented comparisons + moves + visits; swaps count as two moves. Counters are algorithm-specific, not CPU instructions.",
        "runtime": f"Python {platform.python_version()} · {platform.system()} {platform.machine()}",
        "timeout_seconds": TIMEOUT_SECONDS,
        "fairness": "Identical input copies. Instrumented pure Python. Preprocessing and internal result copies included; oracle and process startup excluded from timing.",
    }
