"""Run an API experiment using a user-supplied JSON file."""

import json
import time
from pathlib import Path
from urllib.request import Request, urlopen

BASE = "http://127.0.0.1:8000/api"


def api(path, payload=None):
    request = Request(
        BASE + path,
        data=json.dumps(payload).encode() if payload is not None else None,
        headers={"Content-Type": "application/json"},
    )
    with urlopen(request, timeout=20) as response:
        return json.load(response)


def run(domain, payload):
    selected = api(f"/{domain}/select", payload)
    job_id = api(f"/{domain}/benchmark", payload)["job_id"]
    deadline = time.monotonic() + 70
    while time.monotonic() < deadline:
        job = api(f"/jobs/{job_id}")
        if job["status"] in ("complete", "cancelled", "error"):
            break
        time.sleep(0.2)
    assert job["status"] == "complete", job
    assert all(r["status"] == "ok" and r["correct"] for r in job["results"]), job
    assert job["summary"]["winner"], job
    return {
        "domain": domain,
        "profile": selected["profile"],
        "selection": selected["recommended"],
        "summary": job["summary"],
        "results": job["results"],
        "conditions": job["conditions"],
    }


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Benchmark your own JSON experiment input against the local API.")
    parser.add_argument("input", type=Path, help="JSON file containing data/queries or nodes/edges")
    parser.add_argument("--domain", choices=["sorting", "searching", "graph"], default="sorting")
    parser.add_argument("--output", type=Path, default=Path("docs/user-results.json"))
    args = parser.parse_args()
    payload = json.loads(args.input.read_text(encoding="utf-8"))
    if isinstance(payload, list):
        payload = {"data": payload}
    record = run(args.domain, payload)
    args.output.write_text(json.dumps(record, indent=2), encoding="utf-8")
    print(f"Verified measured experiment saved to {args.output}")


if __name__ == "__main__":
    main()
