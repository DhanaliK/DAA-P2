from app.algorithms.metrics import Metrics


def merge(data: list[int | str], m: Metrics) -> list[int | str]:
    a = list(data)

    def divide(values, offset=0):
        m.recursion_calls += 1
        if len(values) < 2:
            return values
        mid = len(values) // 2
        if m.observer:
            m.emit(
                f"Split positions {offset}–{offset + len(values) - 1} into two runs.",
                array=a,
                active=[offset, offset + mid],
                phase="split",
            )
        left, right = divide(values[:mid], offset), divide(values[mid:], offset + mid)
        out, i, j = [], 0, 0
        while i < len(left) and j < len(right):
            m.comparisons += 1
            if m.observer:
                m.emit(
                    f"Compare {left[i]} and {right[j]} at the heads of the two runs.",
                    array=a,
                    active=[offset + i, offset + mid + j],
                    phase="compare",
                )
            if left[i] <= right[j]:
                out.append(left[i])
                i += 1
            else:
                out.append(right[j])
                j += 1
            m.moves += 1
            if m.observer:
                a[offset : offset + len(out)] = out
                m.emit(
                    f"Write {out[-1]} into the merged run.",
                    array=a,
                    active=[offset + len(out) - 1],
                    phase="merge",
                )
        out.extend(left[i:])
        out.extend(right[j:])
        m.moves += len(left) - i + len(right) - j
        if m.observer:
            a[offset : offset + len(out)] = out
            m.emit(
                "Merge complete for this run.",
                array=a,
                active=list(range(offset, offset + len(out))),
                phase="merge",
            )
        return out

    return divide(a)
