import time

from fastapi.testclient import TestClient

from app.benchmarking.runner import isolated
from app.history import store
from app.main import app
from app.schemas.requests import ExperimentInput
from app.selection.engine import select


def test_isolated_benchmark_and_history():
    req = ExperimentInput(data=[5, 2, -1, 3, 2], trials=3)
    result = isolated("sorting", "merge", req.model_dump())
    assert result["status"] == "ok" and result["correct"]
    assert len(result["trials_ms"]) == 3
    assert result["runtime_ms"] > 0 and result["peak_bytes"] > 0
    selection = select("sorting", req)
    summary = store.save("sorting", selection, [result])
    assert store.detail(summary["id"])["results"][0]["correct"]
    history, count = store.evidence("sorting", selection["profile"])
    assert count == 1 and history["merge"]["samples"] == 1
    assert 0.5 < history["merge"]["score"] < 1


def test_timeout(monkeypatch):
    import app.benchmarking.runner as runner

    monkeypatch.setattr(runner, "TIMEOUT_SECONDS", 0.00001)
    assert (
        runner.isolated("sorting", "merge", ExperimentInput(data=[1]).model_dump())["status"]
        == "timeout"
    )


def test_cancelled():
    assert (
        isolated("sorting", "merge", ExperimentInput(data=[1]).model_dump(), lambda: True)["status"]
        == "cancelled"
    )


def test_api_validation_and_health():
    with TestClient(app) as client:
        assert client.get("/api/health").json()["status"] == "ok"
        assert client.post("/api/sorting/select", json={"data": ["bad", 1]}).status_code == 422
        assert client.post("/api/sorting/select", json={"data": [True]}).status_code == 422
        assert client.post("/api/generate", json={"minimum": 10, "maximum": 0}).status_code == 404
        assert (
            client.post(
                "/api/graph/select",
                json={"nodes": ["A"], "edges": [{"source": "A", "target": "B"}]},
            ).status_code
            == 422
        )
        assert client.post("/api/graph/select", json={"nodes": ["A", "A"]}).status_code == 422
        assert client.get("/api/history/missing").status_code == 404
        assert client.get("/api/jobs/missing").status_code == 404
        assert client.get("/api/metadata").status_code == 200


def test_api_end_to_end():
    with TestClient(app) as client:
        data = [7, 2, 0, 4, 1, 3, 5, 2] * 10
        selected = client.post("/api/sorting/select", json={"data": data}).json()
        assert selected["recommended"] == "counting"
        response = client.post("/api/sorting/benchmark", json={"data": data, "trials": 1})
        assert response.status_code == 202
        job_id = response.json()["job_id"]
        deadline = time.monotonic() + 65
        while time.monotonic() < deadline:
            job = client.get(f"/api/jobs/{job_id}").json()
            if job["status"] in ("complete", "error"):
                break
            time.sleep(0.1)
        assert job["status"] == "complete", job
        assert all(r["status"] == "ok" for r in job["results"]), job
        assert all(r["correct"] for r in job["results"])
        assert job["summary"]["winner"]
        assert client.get("/api/history").json()["stats"]["experiments"] == 1
        after = client.post("/api/sorting/select", json={"data": data}).json()
        assert after["similar_experiments"] == 1
