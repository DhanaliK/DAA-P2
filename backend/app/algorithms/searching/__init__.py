from app.algorithms.metrics import Metrics
from app.algorithms.sorting.merge import merge


def linear(data: list[int | str], queries: list[int | str], m: Metrics, **kwargs) -> list[bool]:
    results = []
    for query in queries:
        if m.observer:
            m.emit(f"Search for {query}.", array=data, query=query, phase="query")
        found = False
        for index, value in enumerate(data):
            if m.observer:
                m.emit(
                    f"Compare position {index}: {value} with {query}.",
                    array=data,
                    active=[index],
                    query=query,
                    phase="compare",
                )
            m.comparisons += 1
            if value == query:
                found = True
                break
        results.append(found)
        if m.observer:
            m.emit(
                f"{query}: {'found' if found else 'not found'}.",
                query=query,
                phase="found" if found else "not found",
                results=results,
            )
    return results


def binary(
    data: list[int | str], queries: list[int | str], m: Metrics, preprocess: bool = False
) -> list[bool]:
    a = merge(data, m) if preprocess else data
    results = []
    for query in queries:
        if m.observer:
            m.emit(f"Search for {query}.", array=data, query=query, phase="query")
        low, high, found = 0, len(a) - 1, False
        while low <= high:
            mid = (low + high) // 2
            if m.observer:
                m.emit(
                    f"Check midpoint {mid}: {a[mid]} in range {low}–{high}.",
                    array=a,
                    active=[mid],
                    query=query,
                    phase="midpoint",
                    variables={"low": low, "mid": mid, "high": high},
                )
            m.comparisons += 1
            if a[mid] == query:
                found = True
                break
            if m.observer:
                m.emit(
                    f"Check midpoint {mid}: {a[mid]} in range {low}–{high}.",
                    array=a,
                    active=[mid],
                    query=query,
                    phase="midpoint",
                    variables={"low": low, "mid": mid, "high": high},
                )
            m.comparisons += 1
            if a[mid] < query:
                low = mid + 1
            else:
                high = mid - 1
        results.append(found)
        if m.observer:
            m.emit(
                f"{query}: {'found' if found else 'not found'}.",
                query=query,
                phase="found" if found else "not found",
                results=results,
            )
    return results


def bucket_index(value: int | str, size: int) -> int:
    if isinstance(value, int):
        return value % size
    # Deterministic polynomial hash; collisions are checked by exact equality.
    result = 0
    for char in value:
        result = (31 * result + ord(char)) % size
    return result


def hash_lookup(
    data: list[int | str], queries: list[int | str], m: Metrics, **kwargs
) -> list[bool]:
    # Explicit separate chaining; includes index construction in every run.
    buckets = [[] for _ in range(max(1, 2 * len(data) + 1))]
    for value in data:
        buckets[bucket_index(value, len(buckets))].append(value)
        m.moves += 1
        if m.observer:
            m.emit(
                f"Insert {value} into bucket {bucket_index(value, len(buckets))}.",
                array=data,
                phase="index",
                variables={"value": value, "bucket": bucket_index(value, len(buckets))},
            )
    results = []
    for query in queries:
        if m.observer:
            m.emit(f"Search for {query}.", array=data, query=query, phase="query")
        m.visits += 1
        found = False
        if m.observer:
            m.emit(
                f"Hash {query} to bucket {bucket_index(query, len(buckets))}; inspect its collision chain.",
                array=buckets[bucket_index(query, len(buckets))],
                query=query,
                phase="bucket",
                variables={"bucket": bucket_index(query, len(buckets))},
            )
        for index, value in enumerate(buckets[bucket_index(query, len(buckets))]):
            if m.observer:
                m.emit(
                    f"Compare chain value {value} with {query}.",
                    array=buckets[bucket_index(query, len(buckets))],
                    active=[index],
                    query=query,
                    phase="compare",
                )
            m.comparisons += 1
            if value == query:
                found = True
                break
        results.append(found)
        if m.observer:
            m.emit(
                f"{query}: {'found' if found else 'not found'}.",
                query=query,
                phase="found" if found else "not found",
                results=results,
            )
    return results


SEARCHES = {"linear": linear, "binary": binary, "hash": hash_lookup}
