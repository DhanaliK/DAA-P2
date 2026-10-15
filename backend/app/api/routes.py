from typing import Literal

from fastapi import APIRouter, HTTPException

from app.algorithms.trace import trace_execution
from app.benchmarking.jobs import cancel, launch, launch_empirical, snapshot
from app.complexity.catalog import CATALOG
from app.core.config import WEIGHTS
from app.history.store import detail, list_experiments
from app.profiling.profiler import profile_data, profile_graph
from app.schemas.requests import EmpiricalInput, ExperimentInput
from app.schemas.responses import HistoryResponse, JobCreated, JobResponse, SelectionResponse
from app.selection.engine import select

router = APIRouter(prefix="/api")
Domain = Literal["sorting", "searching", "graph"]


@router.get("/health")
def health():
    return {"status": "ok", "name": "AlgoAdapt"}


@router.get("/metadata")
def metadata():
    return {"algorithms": CATALOG, "weights": WEIGHTS}


@router.get("/history", response_model=HistoryResponse)
def history(domain: Domain | None = None):
    items = list_experiments(domain)
    evaluated = [x for x in items if x["matched"] is not None]
    baselines = [x for x in items if x["baseline_ms"] and x["selected_ms"]]
    return {
        "items": items,
        "stats": {
            "experiments": len(items),
            "evaluated": len(evaluated),
            "accuracy": sum(x["matched"] for x in evaluated) / len(evaluated)
            if evaluated
            else None,
            "average_gap": sum(x["performance_gap"] for x in evaluated) / len(evaluated)
            if evaluated
            else None,
            "baseline_speedup": sum(x["baseline_ms"] for x in baselines)
            / sum(x["selected_ms"] for x in baselines)
            if baselines
            else None,
        },
    }


@router.get("/history/{exp_id}")
def history_detail(exp_id: str):
    item = detail(exp_id)
    if not item:
        raise HTTPException(404, "Experiment not found.")
    return item


@router.post("/complexity/empirical", response_model=JobCreated)
def empirical(req: EmpiricalInput):
    try:
        return launch_empirical(req)
    except ValueError as exc:
        raise HTTPException(429, str(exc)) from exc


@router.get("/jobs/{job_id}", response_model=JobResponse, response_model_exclude_none=True)
def job(job_id: str):
    data = snapshot(job_id)
    if not data:
        raise HTTPException(
            404,
            "Job not found; the server may have restarted. Completed experiments remain in History.",
        )
    return data


@router.post("/jobs/{job_id}/cancel", response_model=JobResponse, response_model_exclude_none=True)
def cancel_job(job_id: str):
    data = cancel(job_id)
    if not data:
        raise HTTPException(404, "Job not found.")
    return data


@router.post("/{domain}/analyze")
def analyze(domain: Domain, req: ExperimentInput):
    return profile_graph(req) if domain == "graph" else profile_data(req.data)


@router.post("/{domain}/select", response_model=SelectionResponse)
def selection(domain: Domain, req: ExperimentInput):
    return select(domain, req)


@router.post("/{domain}/benchmark", status_code=202, response_model=JobCreated)
def benchmark(domain: Domain, req: ExperimentInput):
    try:
        return launch(domain, req)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc


@router.post("/{domain}/trace/{algorithm}")
def trace(domain: Domain, algorithm: str, req: ExperimentInput):
    try:
        return trace_execution(domain, algorithm, req)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
