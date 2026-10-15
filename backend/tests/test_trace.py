import pytest
from fastapi.testclient import TestClient

from app.algorithms.metrics import Metrics
from app.algorithms.trace import trace_execution
from app.benchmarking.runner import execute
from app.main import app
from app.schemas.requests import EmpiricalInput, ExperimentInput


@pytest.mark.parametrize("algorithm", ["insertion", "merge", "quick", "heap", "counting", "radix"])
@pytest.mark.parametrize("data", [[5, -2, 3, -2, 0, 1], [7, 7, 7], [1]])
def test_sort_frames_are_verified_and_match_execution(algorithm, data):
    req = ExperimentInput(data=data)
    trace = trace_execution("sorting", algorithm, req)
    plain = Metrics()
    assert trace["output"] == execute("sorting", algorithm, req.model_dump(), plain)
    assert trace["metrics"] == plain.export()
    assert trace["frames"][0]["array"] == data
    assert trace["frames"][-1]["array"] == sorted(data)
    assert trace["correct"]
    assert req.data == data


@pytest.mark.parametrize("algorithm", ["linear", "binary", "hash"])
def test_search_visits_and_missing_queries(algorithm):
    req = ExperimentInput(data=[5, -2, 3, -2, 0, 1], queries=[-2, 99], allow_preprocessing=True)
    trace = trace_execution("searching", algorithm, req)
    plain = Metrics()
    assert (
        trace["output"] == execute("searching", algorithm, req.model_dump(), plain) == [True, False]
    )
    assert trace["metrics"] == plain.export()
    assert any(f["phase"] in ("compare", "midpoint") for f in trace["frames"])
    assert trace["correct"]


@pytest.mark.parametrize(
    "algorithm,task",
    [
        ("bfs", "traversal"),
        ("dfs", "traversal"),
        ("dijkstra", "single-source"),
        ("bellman", "single-source"),
        ("floyd", "all-pairs"),
    ],
)
def test_graph_trace_matches_real_execution(algorithm, task):
    req = ExperimentInput(
        nodes=["A", "B", "C", "Z"],
        edges=[
            {"source": "A", "target": "B", "weight": 4},
            {"source": "A", "target": "C", "weight": 1},
            {"source": "C", "target": "B", "weight": 1},
        ],
        task=task,
    )
    trace = trace_execution("graph", algorithm, req)
    plain = Metrics()
    assert trace["output"] == execute("graph", algorithm, req.model_dump(), plain)
    assert trace["metrics"] == plain.export()
    assert trace["correct"]
    assert len(trace["frames"]) > 2


def test_negative_cycle_and_bounds():
    req = ExperimentInput(
        nodes=["A", "B"],
        edges=[
            {"source": "A", "target": "B", "weight": -1},
            {"source": "B", "target": "A", "weight": -1},
        ],
    )
    assert trace_execution("graph", "bellman", req)["output"]["negative_cycle"]
    with pytest.raises(ValueError):
        trace_execution("graph", "dijkstra", req)
    with pytest.raises(ValueError):
        trace_execution("sorting", "merge", ExperimentInput(data=list(range(81))))
    with pytest.raises(ValueError):
        trace_execution("sorting", "merge", ExperimentInput())


def test_routes_require_real_data():
    with TestClient(app) as client:
        assert client.post("/api/generate", json={"n": 10}).status_code == 404
        assert client.post("/api/sorting/trace/merge", json={"data": [3, 1, 2]}).json()["correct"]
        assert client.post("/api/sorting/trace/unknown", json={"data": [3]}).status_code == 400
        assert (
            client.post(
                "/api/complexity/empirical", json={"algorithm": "merge", "sizes": [2, 4]}
            ).status_code
            == 422
        )
    req = EmpiricalInput(data=[9, 8, 7, 6], sizes=[2, 4])
    assert req.data[: req.sizes[0]] == [9, 8]
    with pytest.raises(ValueError):
        EmpiricalInput(data=[1, 2, 3], sizes=[2, 4])
