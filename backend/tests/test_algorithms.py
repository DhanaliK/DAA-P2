import random

import pytest

from app.algorithms.graph import GRAPH
from app.algorithms.metrics import Metrics
from app.algorithms.searching import SEARCHES
from app.algorithms.sorting import SORTS
from app.benchmarking.runner import verify
from app.schemas.requests import ExperimentInput

CASES = [
    [],
    [1],
    [4, 4, 4],
    [9, -4, 2, 0, -4],
    list(range(100)),
    list(range(100, 0, -1)),
    [random.Random(i).randint(-1000, 1000) for i in range(1200)],
]


@pytest.mark.parametrize("name", SORTS)
@pytest.mark.parametrize("data", CASES)
def test_sort(name, data):
    original = list(data)
    m = Metrics()
    assert SORTS[name](data, m) == sorted(data)
    assert data == original
    assert all(v >= 0 for v in m.export().values())


@pytest.mark.parametrize("name", SEARCHES)
@pytest.mark.parametrize(
    "data,queries",
    [([], [1]), ([1], [1, 2]), ([1, 1, 2, 4], [1, 4, 3]), (list(range(100)), [0, 99, -1])],
)
def test_search(name, data, queries):
    assert SEARCHES[name](data, queries, Metrics()) == [q in data for q in queries]


def test_binary_preprocess():
    assert SEARCHES["binary"]([9, 1, 3], [1, 2, 9], Metrics(), preprocess=True) == [
        True,
        False,
        True,
    ]


def test_hash_collisions():
    data = [0, 7, 14]
    assert SEARCHES["hash"](data, [0, 14, 21], Metrics()) == [True, True, False]


def test_counting_guard():
    with pytest.raises(ValueError):
        SORTS["counting"]([0, 10**12], Metrics())


@pytest.mark.parametrize("name", GRAPH)
@pytest.mark.parametrize(
    "nodes,edges",
    [
        ([], []),
        (["A"], []),
        (["A", "B", "C"], []),
        (
            ["A", "B", "C", "D"],
            [
                {"source": "A", "target": "B", "weight": 1},
                {"source": "B", "target": "C", "weight": 1},
                {"source": "C", "target": "A", "weight": 1},
            ],
        ),
    ],
)
def test_graph_edge_cases(name, nodes, edges):
    task = (
        "traversal"
        if name in ("bfs", "dfs")
        else "all-pairs"
        if name == "floyd"
        else "single-source"
    )
    payload = ExperimentInput(nodes=nodes, edges=edges, task=task).model_dump()
    output = GRAPH[name](nodes, edges, True, "A", Metrics())
    assert verify("graph", name, payload, output)


@pytest.mark.parametrize("name", ["dijkstra", "bellman", "floyd"])
def test_weighted_shortest_paths(name):
    edges = [
        {"source": "A", "target": "B", "weight": 4},
        {"source": "A", "target": "C", "weight": 1},
        {"source": "C", "target": "B", "weight": 2},
    ]
    out = GRAPH[name](["A", "B", "C", "D"], edges, True, "A", Metrics())
    dist = out["all_pairs"]["A"] if name == "floyd" else out["distances"]
    assert dist == {"A": 0, "B": 3, "C": 1, "D": None}


@pytest.mark.parametrize("name", ["bellman", "floyd"])
def test_negative_cycle(name):
    edges = [
        {"source": "A", "target": "B", "weight": -2},
        {"source": "B", "target": "A", "weight": 1},
    ]
    assert GRAPH[name](["A", "B"], edges, True, "A", Metrics())["negative_cycle"]


def test_unreachable_negative_cycle():
    edges = [
        {"source": "B", "target": "C", "weight": -2},
        {"source": "C", "target": "B", "weight": 1},
    ]
    assert not GRAPH["bellman"](["A", "B", "C"], edges, True, "A", Metrics())["negative_cycle"]


def test_negative_edge():
    edges = [{"source": "A", "target": "B", "weight": -3}]
    assert GRAPH["bellman"](["A", "B"], edges, True, "A", Metrics())["distances"]["B"] == -3
    with pytest.raises(ValueError):
        GRAPH["dijkstra"](["A", "B"], edges, True, "A", Metrics())


def test_undirected():
    edges = [{"source": "A", "target": "B", "weight": 2}]
    assert GRAPH["dijkstra"](["A", "B"], edges, False, "B", Metrics())["distances"]["A"] == 2


def test_depth_first_discovery_tree():
    edges = [
        {"source": "A", "target": "B", "weight": 1},
        {"source": "A", "target": "C", "weight": 1},
        {"source": "B", "target": "C", "weight": 1},
    ]
    out = GRAPH["dfs"](["A", "B", "C"], edges, True, "A", Metrics())
    assert out["order"] == ["A", "B", "C"]
    assert out["parents"]["C"] == "B"
