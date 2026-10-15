from .counting import counting
from .heap import heap
from .insertion import insertion
from .merge import merge
from .quick import quick
from .radix import radix

SORTS = {
    "insertion": insertion,
    "merge": merge,
    "quick": quick,
    "heap": heap,
    "counting": counting,
    "radix": radix,
}
