from app.algorithms.metrics import Metrics


def quick(data: list[int | str], m: Metrics) -> list[int | str]:
    a = list(data)
    stack = [(0, len(a) - 1)]
    while stack:
        low, high = stack.pop()
        if low >= high:
            continue
        # Median-of-three pivot and three-way partition resist ordered/duplicate inputs.
        x, y, z = a[low], a[(low + high) // 2], a[high]
        m.comparisons += 4
        pivot = max(min(x, y), min(max(x, y), z))
        lt, i, gt = low, low, high
        if m.observer:
            m.emit(
                f"Partition positions {low}–{high} around pivot {pivot}.",
                array=a,
                active=[low, high],
                phase="pivot",
                variables={"pivot": pivot},
            )
        while i <= gt:
            m.comparisons += 1
            if m.observer:
                m.emit(
                    f"Compare {a[i]} against pivot {pivot}.",
                    array=a,
                    active=[i],
                    phase="compare",
                    variables={"pivot": pivot, "left": lt, "right": gt},
                )
            if a[i] < pivot:
                m.swap(a, lt, i)
                lt += 1
                i += 1
            else:
                m.comparisons += 1
                if a[i] > pivot:
                    m.swap(a, i, gt)
                    gt -= 1
                else:
                    i += 1
        left, right = (low, lt - 1), (gt + 1, high)
        # Process the smaller partition first, keeping the explicit stack O(log n).
        if left[1] - left[0] > right[1] - right[0]:
            stack.extend([left, right])
        else:
            stack.extend([right, left])
    return a
