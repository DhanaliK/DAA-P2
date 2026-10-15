from app.algorithms.metrics import Metrics


def counting(data: list[int], m: Metrics) -> list[int]:
    if not data:
        return []
    lo, hi = min(data), max(data)
    m.comparisons += 2 * max(0, len(data) - 1)
    if hi - lo + 1 > 200000:
        raise ValueError("Counting Sort range exceeds the 200,000-bucket safety limit.")
    counts = [0] * (hi - lo + 1)
    for value in data:
        counts[value - lo] += 1
        if m.observer:
            m.emit(
                f"Count value {value}: bucket now contains {counts[value - lo]}.",
                array=data,
                phase="count",
                variables={"value": value, "count": counts[value - lo]},
            )
        m.moves += 1
    for i in range(1, len(counts)):
        counts[i] += counts[i - 1]
        m.moves += 1
    if m.observer:
        m.emit(
            "Prefix counts now give the end position of each value bucket.",
            array=data,
            phase="prefix counts",
        )
    out = [0] * len(data)
    placed = []
    for value in reversed(data):
        counts[value - lo] -= 1
        out[counts[value - lo]] = value
        m.moves += 2
        if m.observer:
            placed.append(counts[value - lo])
            m.emit(
                f"Place {value} at output position {counts[value - lo]}.",
                array=[out[i] if i in placed else None for i in range(len(out))],
                active=[counts[value - lo]],
                phase="place",
            )
    return out
