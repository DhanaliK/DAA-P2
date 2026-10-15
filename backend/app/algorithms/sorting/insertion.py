from app.algorithms.metrics import Metrics


def insertion(data: list[int | str], m: Metrics) -> list[int | str]:
    a = list(data)
    for i in range(1, len(a)):
        value, j = a[i], i - 1
        if m.observer:
            m.emit(
                f"Hold {value}; insert it into the sorted prefix.",
                array=a,
                active=[i],
                phase="pick",
                variables={"held value": value},
            )
        while j >= 0:
            m.comparisons += 1
            if m.observer:
                m.emit(
                    f"Compare {a[j]} with held value {value}.",
                    array=a,
                    active=[j],
                    phase="compare",
                    variables={"held value": value},
                )
            if a[j] <= value:
                break
            a[j + 1] = a[j]
            m.moves += 1
            if m.observer:
                m.emit(
                    f"Shift {a[j]} one position right; the held value stays outside the array.",
                    array=a,
                    active=[j, j + 1],
                    phase="move",
                    variables={"held value": value},
                )
            j -= 1
        a[j + 1] = value
        m.moves += 1
        if m.observer:
            m.emit(f"Place {value} at position {j + 1}.", array=a, active=[j + 1], phase="place")
    return a
