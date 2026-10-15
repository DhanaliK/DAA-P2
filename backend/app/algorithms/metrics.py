from dataclasses import asdict, dataclass


@dataclass
class Metrics:
    comparisons: int = 0
    swaps: int = 0
    moves: int = 0
    recursion_calls: int = 0
    visits: int = 0

    observer = None

    def emit(self, message, **state):
        if self.observer:
            self.observer(message, **state)

    def swap(self, a, i, j):
        a[i], a[j] = a[j], a[i]
        self.swaps += 1
        self.moves += 2
        if self.observer:
            self.emit(f"Swap positions {i} and {j}.", array=a, active=[i, j], phase="swap")

    def export(self):
        d = asdict(self)
        d["operations"] = self.comparisons + self.moves + self.visits
        return d
