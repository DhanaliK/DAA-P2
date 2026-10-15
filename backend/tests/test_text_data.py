import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.algorithms.metrics import Metrics
from app.algorithms.searching import bucket_index, hash_lookup
from app.algorithms.trace import trace_execution
from app.benchmarking.runner import execute, isolated
from app.history import store
from app.main import app
from app.profiling.profiler import profile_data
from app.schemas.requests import EmpiricalInput, ExperimentInput
from app.selection.engine import select

TEXT = ["banana", "A2", "A10", "apple", "0012", "apple", "New York", "é", "😀"]


@pytest.mark.parametrize("algorithm", ["insertion", "merge", "quick", "heap"])
@pytest.mark.parametrize("data", [TEXT, ["same"] * 4, ["z"], ["😀", "\ue000", "A", "a"]])
def test_comparison_sorts_preserve_and_order_text(algorithm, data):
    req = ExperimentInput(data=data)
    trace = trace_execution("sorting", algorithm, req)
    assert trace["correct"]
    assert trace["output"] == sorted(data)
    assert trace["frames"][-1]["array"] == sorted(data)
    plain = Metrics()
    assert execute("sorting", algorithm, req.model_dump(), plain) == sorted(data)
    assert trace["metrics"] == plain.export()
    assert req.data == data


@pytest.mark.parametrize("algorithm", ["linear", "binary", "hash"])
def test_text_search_exact_matches_with_preprocessing(algorithm):
    req = ExperimentInput(
        data=TEXT, queries=["apple", "Apple", "0012", "12", "😀"], allow_preprocessing=True
    )
    trace = trace_execution("searching", algorithm, req)
    assert trace["correct"]
    assert trace["output"] == [True, False, True, False, True]


def test_text_hash_collision_chain_checks_full_value():
    assert bucket_index("Aa", 5) == bucket_index("BB", 5)
    assert hash_lookup(["Aa", "other"], ["Aa", "BB"], Metrics()) == [True, False]


def test_text_profile_and_eligibility():
    p = profile_data(TEXT)
    assert p["data_type"] == "text" and p["range"] is None and p["histogram"] == []
    assert p["max_length"] == 8 and p["unique"] == len(set(TEXT))
    assert p["inversions"] == sum(a > b for i, a in enumerate(TEXT) for b in TEXT[i + 1 :])
    req = ExperimentInput(data=TEXT)
    selection = select("sorting", req)
    assert {c["id"] for c in selection["candidates"] if c["eligible"]} == {
        "insertion",
        "merge",
        "quick",
        "heap",
    }
    for algorithm in ["counting", "radix"]:
        with pytest.raises(ValueError):
            trace_execution("sorting", algorithm, req)
        with pytest.raises(ValidationError):
            EmpiricalInput(data=TEXT, sizes=[2, 4], algorithm=algorithm)
    search = select("searching", ExperimentInput(data=TEXT, queries=["apple"]))
    assert not next(c for c in search["candidates"] if c["id"] == "binary")["eligible"]
    assert EmpiricalInput(data=TEXT, sizes=[2, 4]).data == TEXT


@pytest.mark.parametrize("data", [[1, "2"], [True], [1.5], [""], ["  "], ["a" * 257]])
def test_invalid_or_mixed_types_rejected(data):
    with pytest.raises(ValidationError):
        ExperimentInput(data=data)


def test_query_type_must_match_data():
    with pytest.raises(ValidationError):
        ExperimentInput(data=["0012"], queries=[12])


@pytest.mark.parametrize("domain,algorithm", [("sorting", "merge"), ("searching", "hash")])
def test_text_isolated_workers_and_history(domain, algorithm):
    req = ExperimentInput(data=TEXT, queries=["apple", "missing"], trials=1)
    result = isolated(domain, algorithm, req.model_dump())
    assert result["status"] == "ok" and result["correct"]
    selection = select(domain, req)
    summary = store.save(domain, selection, [result])
    assert store.detail(summary["id"])["results"][0]["output"] == result["output"]
    assert store.evidence(domain, selection["profile"])[1] == 1
    numeric = {**selection["profile"], "data_type": "number", "range": 100}
    assert store.evidence(domain, numeric)[1] == 0


def test_text_api_routes():
    with TestClient(app) as client:
        req = {"data": TEXT}
        response = client.post("/api/sorting/select", json=req)
        assert response.status_code == 200
        assert response.json()["profile"]["data_type"] == "text"
        assert client.post("/api/sorting/trace/merge", json=req).json()["output"] == sorted(TEXT)
        assert client.post("/api/sorting/trace/counting", json=req).status_code == 400
        assert (
            client.post("/api/searching/select", json={**req, "queries": [12]}).status_code == 422
        )
