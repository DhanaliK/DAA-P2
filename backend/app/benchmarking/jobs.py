import copy
import threading
import uuid

from app.benchmarking.runner import conditions, isolated
from app.history.store import save
from app.schemas.requests import ExperimentInput
from app.selection.engine import select

JOBS = {}
LOCK = threading.RLock()


def snapshot(job_id):
    with LOCK:
        return copy.deepcopy(JOBS.get(job_id))


def update(job_id, **values):
    with LOCK:
        JOBS[job_id].update(values)


def cancel(job_id):
    with LOCK:
        job = JOBS.get(job_id)
        if job and job["status"] in ("queued", "running"):
            job["cancel_requested"] = True
        return copy.deepcopy(job)


def is_cancelled(job_id):
    with LOCK:
        return JOBS[job_id]["cancel_requested"]


def allocate(kind):
    with LOCK:
        if sum(j["status"] in ("queued", "running") for j in JOBS.values()) >= 2:
            raise ValueError(
                "Two experiments are already running. Wait or cancel one before starting another."
            )
        if len(JOBS) >= 64:
            finished = [k for k, j in JOBS.items() if j["status"] not in ("queued", "running")]
            for k in finished[: len(JOBS) - 63]:
                del JOBS[k]
        job_id = str(uuid.uuid4())
        JOBS[job_id] = {
            "id": job_id,
            "kind": kind,
            "status": "queued",
            "progress": 0,
            "current": "Preparing",
            "results": [],
            "cancel_requested": False,
        }
    return job_id


def launch(domain, req):
    selection = select(domain, req)
    selection["benchmark_conditions"] = conditions(req.trials)
    if not selection["recommended"]:
        raise ValueError("No applicable algorithms match these constraints.")
    job_id = allocate("benchmark")
    update(job_id, selection=selection, conditions=conditions(req.trials))
    thread = threading.Thread(
        target=run_benchmark, args=(job_id, domain, req, selection), daemon=True
    )
    thread.start()
    return {"job_id": job_id}


def run_benchmark(job_id, domain, req, selection):
    try:
        update(job_id, status="running")
        candidates = [c for c in selection["candidates"] if c["eligible"]]
        results = []
        for index, c in enumerate(candidates):
            if is_cancelled(job_id):
                break
            update(job_id, current=c["name"], progress=index / len(candidates))
            if c["id"] == "insertion" and selection["profile"].get("inversions", 0) > 2_000_000:
                result = {
                    "algorithm": c["id"],
                    "status": "skipped",
                    "error": "More than 2 million inversions: quadratic run skipped by safety policy.",
                }
            else:
                result = isolated(domain, c["id"], req.model_dump(), lambda: is_cancelled(job_id))
            results.append(result)
            update(job_id, results=copy.deepcopy(results), progress=(index + 1) / len(candidates))
        if is_cancelled(job_id):
            update(job_id, status="cancelled", current="Cancelled; partial run was not saved.")
        else:
            summary = save(domain, selection, results)
            update(job_id, status="complete", current="Complete", progress=1, summary=summary)
    except Exception as exc:
        update(job_id, status="error", error=str(exc))


def launch_empirical(req):
    job_id = allocate("empirical")
    threading.Thread(target=run_empirical, args=(job_id, req), daemon=True).start()
    return {"job_id": job_id}


def run_empirical(job_id, req):
    try:
        update(job_id, status="running", conditions=conditions(3))
        points = []
        for i, n in enumerate(req.sizes):
            if is_cancelled(job_id):
                break
            data = req.data[:n]
            payload = ExperimentInput(data=data)
            selection = select("sorting", payload, use_history=False)
            candidate = next(c for c in selection["candidates"] if c["id"] == req.algorithm)
            update(job_id, current=f"n = {n:,}")
            if not candidate["eligible"]:
                result = {
                    "algorithm": req.algorithm,
                    "status": "skipped",
                    "error": "; ".join(candidate["exclusions"]),
                }
            else:
                result = isolated(
                    "sorting", req.algorithm, payload.model_dump(), lambda: is_cancelled(job_id)
                )
            points.append({"n": n, **result})
            update(job_id, results=copy.deepcopy(points), progress=(i + 1) / len(req.sizes))
        update(
            job_id, status="cancelled" if is_cancelled(job_id) else "complete", current="Complete"
        )
    except Exception as exc:
        update(job_id, status="error", error=str(exc))
