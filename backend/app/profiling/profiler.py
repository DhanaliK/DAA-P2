def inversion_count(data: list[int | str]) -> int:
    def count(a):
        if len(a) < 2:
            return a, 0
        mid = len(a) // 2
        left, x = count(a[:mid])
        right, y = count(a[mid:])
        out, i, j, inv = [], 0, 0, x + y
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                out.append(left[i])
                i += 1
            else:
                out.append(right[j])
                j += 1
                inv += len(left) - i
        return out + left[i:] + right[j:], inv

    return count(list(data))[1]


def profile_data(data: list[int | str]) -> dict:
    n, unique = len(data), len(set(data))
    minimum, maximum = (min(data), max(data)) if data else (None, None)
    inversions = inversion_count(data)
    text = bool(data) and isinstance(data[0], str)
    span = None if text else maximum - minimum + 1 if n else 0
    bins = [] if text else [0] * 16
    if not text:
        for x in data:
            bins[min(15, (x - minimum) * 16 // max(1, span))] += 1
    return {
        "n": n,
        "data_type": "text" if text else "number",
        "max_length": max(map(len, data), default=0) if text else None,
        "average_length": sum(map(len, data)) / n if text else None,
        "ordering": "Case-sensitive Unicode lexicographic order"
        if text
        else "Ascending integer order",
        "minimum": minimum,
        "maximum": maximum,
        "range": span,
        "unique": unique,
        "duplicate_ratio": (n - unique) / n if n else 0,
        "sortedness": sum(a <= b for a, b in zip(data, data[1:])) / (n - 1) if n > 1 else 1,
        "reverse_sortedness": sum(a >= b for a, b in zip(data, data[1:])) / (n - 1) if n > 1 else 1,
        "inversions": inversions,
        "disorder": inversions / (n * (n - 1) / 2) if n > 1 else 0,
        "histogram": bins,
        "sample": data[:120],
        "sample_note": "First 120 elements; profile uses the complete input.",
    }


def profile_graph(req):
    v, e = len(req.nodes), len(req.edges)
    possible = v * (v - 1) / (1 if req.directed else 2)
    nonloops = sum(edge.source != edge.target for edge in req.edges)
    return {
        "n": v,
        "vertices": v,
        "edges": e,
        "density": nonloops / possible if possible else 0,
        "directed": req.directed,
        "weighted": any(edge.weight != 1 for edge in req.edges),
        "negative_edges": sum(edge.weight < 0 for edge in req.edges),
        "task": req.task,
    }
