import os
from pathlib import Path

WEIGHTS = {"complexity": 0.40, "fit": 0.30, "memory": 0.15, "history": 0.15}
DATABASE = Path(
    os.getenv("ALGOADAPT_DB", str(Path(__file__).resolve().parents[2] / "algoadapt.sqlite3"))
)
MAX_ELEMENTS = 20000
TIMEOUT_SECONDS = 8
