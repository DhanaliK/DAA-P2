from typing import Any, Literal

from pydantic import BaseModel, Field


class CandidateResponse(BaseModel):
    id: str
    name: str
    eligible: bool
    reasons: list[str]
    exclusions: list[str]
    estimated_work: float
    components: dict[str, float]
    history_samples: int
    metadata: dict[str, Any]
    score: float = Field(ge=0, le=100)


class SelectionResponse(BaseModel):
    domain: Literal["sorting", "searching", "graph"]
    profile: dict[str, Any]
    candidates: list[CandidateResponse]
    recommended: str | None
    weights: dict[str, float]
    similar_experiments: int
    note: str


class JobCreated(BaseModel):
    job_id: str


class ResultResponse(BaseModel):
    algorithm: str
    status: Literal["ok", "incorrect", "error", "timeout", "cancelled", "skipped"]
    correct: bool | None = None
    runtime_ms: float | None = None
    trials_ms: list[float] | None = None
    peak_bytes: int | None = None
    metrics: dict[str, int] | None = None
    output: list[Any] | dict[str, Any] | None = None
    output_truncated: bool | None = None
    error: str | None = None
    n: int | None = None


class JobResponse(BaseModel):
    id: str
    kind: str
    status: Literal["queued", "running", "complete", "cancelled", "error"]
    progress: float = Field(ge=0, le=1)
    current: str
    results: list[ResultResponse]
    cancel_requested: bool
    selection: dict[str, Any] | None = None
    conditions: dict[str, Any] | None = None
    summary: dict[str, Any] | None = None
    error: str | None = None


class HistoryResponse(BaseModel):
    items: list[dict[str, Any]]
    stats: dict[str, int | float | None]
