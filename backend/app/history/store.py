import json
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from math import log2

from app.core.config import DATABASE


@contextmanager
def connect():
    db = sqlite3.connect(DATABASE, timeout=10)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    try:
        with db:
            yield db
    finally:
        db.close()


def initialize():
    DATABASE.parent.mkdir(parents=True, exist_ok=True)
    with connect() as db:
        db.executescript("""
        PRAGMA journal_mode=WAL;
        CREATE TABLE IF NOT EXISTS experiments (
            id TEXT PRIMARY KEY, created_at TEXT NOT NULL, domain TEXT NOT NULL,
            selected TEXT NOT NULL, winner TEXT, performance_gap REAL, baseline_ms REAL,
            selected_ms REAL, matched INTEGER, selection_json TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS dataset_profiles (
            experiment_id TEXT PRIMARY KEY REFERENCES experiments(id), profile_json TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS algorithm_results (
            id INTEGER PRIMARY KEY, experiment_id TEXT REFERENCES experiments(id), algorithm TEXT NOT NULL,
            score REAL, runtime_ms REAL, operations INTEGER, peak_bytes INTEGER, status TEXT, result_json TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS benchmark_runs (
            id INTEGER PRIMARY KEY, experiment_id TEXT REFERENCES experiments(id), algorithm TEXT NOT NULL,
            trial INTEGER, runtime_ms REAL NOT NULL);
        CREATE INDEX IF NOT EXISTS experiments_domain_time ON experiments(domain, created_at);
        """)


def save(domain, selection, results):
    good = [r for r in results if r["status"] == "ok"]
    winner = min(good, key=lambda r: r["runtime_ms"])["algorithm"] if good else None
    chosen = next((r for r in good if r["algorithm"] == selection["recommended"]), None)
    fastest = min((r["runtime_ms"] for r in good), default=None)
    gap = (chosen["runtime_ms"] / fastest - 1) * 100 if chosen and fastest else None
    baseline_id = {"sorting": "quick", "searching": "linear", "graph": "bellman"}[domain]
    baseline = next((r["runtime_ms"] for r in good if r["algorithm"] == baseline_id), None)
    exp_id, created = str(uuid.uuid4()), datetime.now(timezone.utc).isoformat()
    matched = int(selection["recommended"] == winner) if chosen and winner else None
    with connect() as db:
        db.execute(
            "INSERT INTO experiments VALUES (?,?,?,?,?,?,?,?,?,?)",
            (
                exp_id,
                created,
                domain,
                selection["recommended"],
                winner,
                gap,
                baseline,
                chosen["runtime_ms"] if chosen else None,
                matched,
                json.dumps(selection),
            ),
        )
        db.execute(
            "INSERT INTO dataset_profiles VALUES (?,?)", (exp_id, json.dumps(selection["profile"]))
        )
        for r in results:
            score = next(c["score"] for c in selection["candidates"] if c["id"] == r["algorithm"])
            db.execute(
                "INSERT INTO algorithm_results (experiment_id,algorithm,score,runtime_ms,operations,peak_bytes,status,result_json) VALUES (?,?,?,?,?,?,?,?)",
                (
                    exp_id,
                    r["algorithm"],
                    score,
                    r.get("runtime_ms"),
                    r.get("metrics", {}).get("operations"),
                    r.get("peak_bytes"),
                    r["status"],
                    json.dumps(r),
                ),
            )
            for i, ms in enumerate(r.get("trials_ms", [])):
                db.execute(
                    "INSERT INTO benchmark_runs (experiment_id,algorithm,trial,runtime_ms) VALUES (?,?,?,?)",
                    (exp_id, r["algorithm"], i + 1, ms),
                )
    return {
        "id": exp_id,
        "created_at": created,
        "winner": winner,
        "selected": selection["recommended"],
        "performance_gap": gap,
        "matched": bool(matched) if matched is not None else None,
        "baseline_algorithm": baseline_id,
        "baseline_ms": baseline,
        "selected_ms": chosen["runtime_ms"] if chosen else None,
    }


def list_experiments(domain=None):
    with connect() as db:
        rows = db.execute(
            "SELECT e.*, p.profile_json FROM experiments e JOIN dataset_profiles p ON p.experiment_id=e.id "
            + ("WHERE e.domain=? " if domain else "")
            + "ORDER BY created_at DESC LIMIT 500",
            (domain,) if domain else (),
        ).fetchall()
    return [
        {
            **{k: r[k] for k in r.keys() if k not in ("selection_json", "profile_json")},
            "profile": json.loads(r["profile_json"]),
        }
        for r in rows
    ]


def detail(exp_id):
    with connect() as db:
        row = db.execute("SELECT * FROM experiments WHERE id=?", (exp_id,)).fetchone()
        if not row:
            return None
        results = db.execute(
            "SELECT result_json FROM algorithm_results WHERE experiment_id=?", (exp_id,)
        ).fetchall()
    return {
        **dict(row),
        "selection": json.loads(row["selection_json"]),
        "results": [json.loads(r[0]) for r in results],
    }


def evidence(domain, profile):
    history, values, count = list_experiments(domain), {}, 0
    for item in history[:100]:
        old = item["profile"]
        if abs(log2(max(1, old["n"])) - log2(max(1, profile["n"]))) > 1:
            continue
        if domain == "graph":
            if any(old.get(k) != profile.get(k) for k in ("task", "directed", "weighted")):
                continue
            if bool(old["negative_edges"]) != bool(profile["negative_edges"]):
                continue
            if abs(old["density"] - profile["density"]) > 0.2:
                continue
        else:
            if old.get("data_type", "number") != profile.get("data_type", "number"):
                continue
            if (
                profile.get("data_type") == "text"
                and abs(
                    log2(max(1, old.get("average_length", 1)))
                    - log2(max(1, profile["average_length"]))
                )
                > 2
            ):
                continue
            if abs(old["disorder"] - profile["disorder"]) > 0.12:
                continue
            if abs(old["duplicate_ratio"] - profile["duplicate_ratio"]) > 0.2:
                continue
            if (
                abs(
                    log2(max(1, (old["range"] or 0) / max(1, old["n"])))
                    - log2(max(1, (profile["range"] or 0) / max(1, profile["n"])))
                )
                > 2
            ):
                continue
            if domain == "searching" and any(
                old.get(k) != profile.get(k)
                for k in ("query_count", "updates", "allow_preprocessing")
            ):
                continue
        past = detail(item["id"])
        good = [r for r in past["results"] if r["status"] == "ok"]
        if not good:
            continue
        count += 1
        fastest = min(r["runtime_ms"] for r in good)
        for r in good:
            values.setdefault(r["algorithm"], []).append(fastest / max(r["runtime_ms"], 0.000001))
        if count >= 20:
            break
    # Two neutral pseudo-observations reduce overreaction to noisy single runs.
    return {
        k: {"score": (1 + sum(v)) / (2 + len(v)), "samples": len(v)} for k, v in values.items()
    }, count
