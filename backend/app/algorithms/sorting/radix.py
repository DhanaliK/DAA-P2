from app.algorithms.metrics import Metrics


def radix(data: list[int], m: Metrics) -> list[int]:
    if not data:
        return []
    # Offset signed integers; order and stability are preserved by translation.
    lo = min(data)
    a = [x - lo for x in data]
    m.moves += len(a)
    m.comparisons += max(0, len(a) - 1) * 2
    maximum, exponent = max(a), 1
    while maximum // exponent > 0:
        counts, out = [0] * 256, [0] * len(a)
        for x in a:
            counts[(x // exponent) % 256] += 1
            m.moves += 1
        for i in range(1, 256):
            counts[i] += counts[i - 1]
            m.moves += 1
        for x in reversed(a):
            digit = (x // exponent) % 256
            counts[digit] -= 1
            out[counts[digit]] = x
            m.moves += 2
        a = out
        if m.observer:
            m.emit(
                f"Stable counting pass on base-256 digit at place {exponent}. Values shown with the signed offset restored.",
                array=[x + lo for x in a],
                phase="digit pass",
                variables={"digit place": exponent, "offset": lo},
            )
        exponent *= 256
    m.moves += len(a)
    return [x + lo for x in a]
