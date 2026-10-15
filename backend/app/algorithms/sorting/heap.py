from app.algorithms.metrics import Metrics


def heap(data: list[int | str], m: Metrics) -> list[int | str]:
    a = list(data)

    def sift(root, end):
        while 2 * root + 1 < end:
            child = 2 * root + 1
            if child + 1 < end:
                m.comparisons += 1
                if a[child + 1] > a[child]:
                    child += 1
            m.comparisons += 1
            if m.observer:
                m.emit(
                    f"Compare parent {a[root]} with child {a[child]}.",
                    array=a,
                    active=[root, child],
                    phase="compare",
                )
            if a[root] >= a[child]:
                return
            m.swap(a, root, child)
            root = child

    for i in range(len(a) // 2 - 1, -1, -1):
        sift(i, len(a))
    for end in range(len(a) - 1, 0, -1):
        m.swap(a, 0, end)
        sift(0, end)
        if m.observer:
            m.emit(
                f"Position {end} is now fixed in the sorted suffix.",
                array=a,
                active=[end],
                phase="placed",
            )
    return a
