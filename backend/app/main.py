from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.benchmarking.jobs import JOBS, LOCK
from app.history.store import initialize


@asynccontextmanager
async def lifespan(app):
    initialize()
    yield
    with LOCK:
        for job in JOBS.values():
            job["cancel_requested"] = True


app = FastAPI(
    title="AlgoAdapt",
    version="1.0.0",
    lifespan=lifespan,
    description="Transparent algorithm selection, isolated benchmarks, and empirical history.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
app.include_router(router)
