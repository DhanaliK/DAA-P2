import random

import pytest

from app.core.config import WEIGHTS
from app.profiling.profiler import profile_data
from app.schemas.requests import ExperimentInput
from app.selection.engine import select


@pytest.mark.parametrize(
    "data,inv", [([], 0), ([1], 0), ([1, 1], 0), ([3, 2, 1], 3), ([2, 1, 3], 1)]
)
def test_profile(data, inv):
    p = profile_data(data)
    assert p["inversions"] == inv
    assert sum(p["histogram"]) == len(data)
    assert 0 <= p["sortedness"] <= 1


def test_demo_changes():
    choices = {}
    rng = random.Random(42)
    fixtures = {
        "random": [rng.randrange(10000) for _ in range(512)],
        "nearly-sorted": list(range(512)),
        "small-range": [rng.randrange(8) for _ in range(512)],
    }
    for kind, data in fixtures.items():
        choices[kind] = select("sorting", ExperimentInput(data=data))["recommended"]
    assert choices["nearly-sorted"] == "insertion"
    assert choices["small-range"] == "counting"
    assert choices["random"] != choices["nearly-sorted"]


def test_formula_and_stability():
    s = select("sorting", ExperimentInput(data=[4, 1, 3], stable=True))
    for c in s["candidates"]:
        if c["eligible"]:
            assert c["score"] == round(
                100 * sum(WEIGHTS[k] * c["components"][k] for k in WEIGHTS), 2
            )
            assert c["metadata"]["stable"]
        else:
            assert c["exclusions"]


def test_memory_and_range():
    s = select("sorting", ExperimentInput(data=[-(10**12), 10**12], memory="limited"))
    assert {c["id"] for c in s["candidates"] if c["eligible"]} == {"insertion", "quick", "heap"}


def test_binary_constraint():
    s = select("searching", ExperimentInput(data=[3, 1, 2], queries=[1]))
    assert not next(c for c in s["candidates"] if c["id"] == "binary")["eligible"]
    assert (
        select("searching", ExperimentInput(data=[3, 1, 2], queries=[1]))["recommended"] == "linear"
    )


def test_search_query_count():
    many = select(
        "searching", ExperimentInput(data=list(range(1000, 0, -1)), queries=list(range(500)))
    )
    assert many["recommended"] == "hash"


def test_graph_filters():
    req = ExperimentInput(nodes=["A", "B"], edges=[{"source": "A", "target": "B", "weight": -1}])
    s = select("graph", req)
    assert s["recommended"] == "bellman"
    assert not next(c for c in s["candidates"] if c["id"] == "dijkstra")["eligible"]
    req.task = "all-pairs"
    assert select("graph", req)["recommended"] == "floyd"
    req.task = "traversal"
    assert {c["id"] for c in select("graph", req)["candidates"] if c["eligible"]} == {"bfs", "dfs"}
