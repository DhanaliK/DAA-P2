from typing import Literal

from pydantic import BaseModel, Field, StrictInt, StrictStr, model_validator

Scalar = StrictInt | StrictStr


def validate_sequence(values):
    if len({type(x) for x in values}) > 1:
        raise ValueError(
            "Use either integers or text throughout the data and search targets, not mixed types."
        )
    for x in values:
        if isinstance(x, str):
            if not x.strip() or len(x) > 256:
                raise ValueError(
                    "Each text value must contain 1–256 characters and cannot be blank."
                )
        elif abs(x) > 10**12:
            raise ValueError("Integers must be between -10^12 and 10^12.")
    if sum(len(x) for x in values if isinstance(x, str)) > 1000000:
        raise ValueError("Text input must contain at most 1,000,000 characters in total.")


class Edge(BaseModel):
    source: str = Field(min_length=1, max_length=32)
    target: str = Field(min_length=1, max_length=32)
    weight: int = Field(default=1, ge=-1000000, le=1000000)


class ExperimentInput(BaseModel):
    data: list[Scalar] = Field(default_factory=list, max_length=20000)
    queries: list[Scalar] = Field(default_factory=list, max_length=2000)
    updates: int = Field(default=0, ge=0, le=10000)
    allow_preprocessing: bool = False
    memory: Literal["balanced", "limited"] = "balanced"
    stable: bool = False
    nodes: list[str] = Field(default_factory=list, max_length=80)
    edges: list[Edge] = Field(default_factory=list, max_length=2000)
    directed: bool = True
    task: Literal["traversal", "single-source", "all-pairs"] = "single-source"
    source: str = "A"
    trials: int = Field(default=3, ge=1, le=5)

    @model_validator(mode="after")
    def validate_values(self):
        validate_sequence(self.data + self.queries)
        if len(set(self.nodes)) != len(self.nodes):
            raise ValueError("Node labels must be unique.")
        if any(not n or len(n) > 32 for n in self.nodes):
            raise ValueError("Node labels must contain 1–32 characters.")
        known = set(self.nodes)
        if any(e.source not in known or e.target not in known for e in self.edges):
            raise ValueError("Every edge endpoint must be listed in nodes.")
        if self.nodes and self.source not in known:
            raise ValueError("Source must be one of the graph nodes.")
        pairs = [
            (e.source, e.target) if self.directed else tuple(sorted((e.source, e.target)))
            for e in self.edges
        ]
        if len(set(pairs)) != len(pairs):
            raise ValueError("Parallel/duplicate edges are not supported.")
        return self


class EmpiricalInput(BaseModel):
    algorithm: Literal["insertion", "merge", "quick", "heap", "counting", "radix"] = "merge"
    data: list[Scalar] = Field(min_length=3, max_length=20000)
    sizes: list[int] = Field(default=[64, 128, 256, 512, 1024], min_length=2, max_length=6)

    @model_validator(mode="after")
    def check_sizes(self):
        validate_sequence(self.data)
        if isinstance(self.data[0], str) and self.algorithm in ("counting", "radix"):
            raise ValueError("Counting Sort and Radix Sort implementations require integers.")
        if max(self.sizes) > len(self.data):
            raise ValueError("Each measured size must fit within your submitted data.")
        if any(n < 2 or n > 4000 for n in self.sizes) or self.sizes != sorted(set(self.sizes)):
            raise ValueError("Use 2–6 increasing, unique sizes between 2 and 4,000.")
        return self
