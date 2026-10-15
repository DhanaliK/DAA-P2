# AlgoAdapt
### An Adaptive Algorithm Selection and Performance Analysis System

A complete local DAA laboratory that asks: **Which algorithm suits this input, why, and does execution support the decision?**

**Analyze → Select → Explain → Execute → Benchmark → Compare → Adapt**

The interface connects input signatures, computed profiles, suitability scores, real performance, and persistent evidence. There are no simulated benchmark values, mock APIs, or opaque ML decisions.

## Start on Windows

Requirements: Python 3.10+ and Node.js 20.9+ (verified here with Python 3.10 and Node 22). Run the following from this project directory.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

If PowerShell activation is disabled by your local policy, activation is optional: use the virtual environment executable directly.

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

CMD activation: `.venv\Scripts\activate.bat`.

Open a **second terminal**:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Open **http://127.0.0.1:3000**. API documentation: **http://127.0.0.1:8000/docs**.

Run only one frontend at a time. Both `dev` and `start` explicitly use port 3000, so they no longer silently switch to 3001. If port 3000 is occupied, reuse the running app or stop its terminal with Ctrl+C before restarting.

## Your input, visualized

See [How input analysis works](docs/how-analysis-works.md) for the profiling algorithm, ranking formula, analysis overhead, and text demonstration examples.

1. Open **Algorithm studio** and choose **Integers** or **Text / alphanumeric**, then type, paste, or upload CSV/TXT/JSON. No sample dataset is loaded. For searching, enter matching-type targets too. Click **Analyze input**, or press Ctrl+Enter in the data field (Cmd+Enter on Mac). Enter alone adds a newline; Enter in the targets field submits.
2. Click **Watch this algorithm step by step**. Select any eligible algorithm, then use **Play / Pause**, **Next / Previous**, **Restart**, the speed selector, or the timeline. Orange marks an active operation; green marks visited or completed values. Each frame describes what happened.
3. Open **Benchmark lab → Run benchmark** to measure real runtime, operations and memory and save the experiment. Playback speed is a teaching control, not measured algorithm speed.

Graphs accept pasted/uploaded edge CSV (`source,target,weight`) and optional isolated node labels. No graph presets are loaded. The player shows traversal, frontier/stack, distance relaxations and the Floyd–Warshall matrix. Complexity measurements use increasing prefixes of your own dataset, preserving its original order; the reference Big-O curves remain theoretical.

Visual traces come from the same Python implementations used in benchmarks, and complete outputs are independently verified. Playback supports up to 80 values, 8 search targets, or 16 graph nodes / 60 edges. Bigger inputs retain full analysis and benchmarking; the player explains its limit instead of sampling silently. At most 4,000 frames are returned; any omitted intermediate steps are disclosed.

SQLite initializes automatically at `backend/algoadapt.sqlite3`. No database installation or migration command is required. The database and venv are ignored by Git. Use one backend process; do not run multiple Uvicorn workers because live job state is in memory. Local development needs no credentials or external services.

You can also run `./scripts/start-backend.ps1` and `./scripts/start-frontend.ps1` in separate terminals after installation.

For a production frontend build:

```powershell
cd frontend
npm.cmd run build
npm.cmd start
```

Stop the development frontend first if port 3000 is occupied. Keep the backend running.

Optional configuration:

- `ALGOADAPT_DB`: SQLite file path, read when the backend starts. Default is anchored to the backend directory, independent of the shell's working directory.
- `BACKEND_URL`: upstream URL for the Next.js `/api` proxy, default `http://127.0.0.1:8000`. Set before frontend startup/build.
- The example env files document variables; set them in the shell or copy the frontend example to `.env.local`. Backend shell variables are used directly; it does not silently load a `.env` file.

## Architecture and project structure

```text
backend/
  app/
    main.py                 FastAPI lifecycle and middleware
    api/                    HTTP routes
    schemas/                Input and response validation
    core/                   Shared weights and safety policy
    algorithms/
      sorting/              Six individual implementations
      searching/            Linear, binary, explicit hash chains
      graph/                Five graph algorithms
    profiling/              Exact inversions, distributions, graph properties
    complexity/             Central algorithm metadata catalog
    selection/              Hard constraints and weighted scoring
    benchmarking/           Isolated process runner and bounded jobs
    history/                SQLite schema, persistence, similarity matching
  tests/                    Algorithm, selection, API, benchmark tests
  requirements.txt
frontend/
  app/                      Next.js App Router pages
  components/               Shared shell, visualization primitives, shadcn Button
  features/                 Dashboard, selector, complexity, benchmark, graph, history
  hooks/                    Persistent workspace and asynchronous job polling
  lib/                      Typed API client, formatting utilities
  types/                    Shared TypeScript contracts
  tests/                    Playwright end-to-end journeys
  public/                   App icon
scripts/                    Start commands and reproducible API demo
docs/                       Architecture, methodology, testing, demo guides
```

Frontend: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui Button composition, Recharts, Cytoscape.js. Backend: FastAPI, Pydantic, manually implemented Python algorithms, Python SQLite driver. Next.js proxies REST requests to the backend. Dependencies are recorded in the frontend lockfile and backend lock requirements. `backend/requirements.txt` uses `requirements-lock.txt` as constraints to reproduce the verified versions.

## Features

- Overview with an empty starting state, your submitted input and recommendation, plus actual experiment statistics.
- Sorting/searching studio with integer or text CSV/TXT/JSON import, typed/pasted data, memory policy, stability constraint, and visible eligibility decisions.
- Profile: n, min/max, integer range, unique count, duplicate ratio, adjacent order, reverse order, exact inversion count, disorder ratio, and histogram data.
- Recommendation with ranked candidates, best/average/worst/space metadata, detailed reasons, exclusions, component scores, and fixed weight contributions.
- Complexity Lab: O(1), O(log n), O(n), O(n log n), O(n²), selectable curves, linear/log scale, algorithm metadata and recurrences, actual five-size empirical sweeps.
- Benchmark Lab: isolated workers, progress, cancellation, median trials, runtime and operation charts, correctness results, separate traced memory, prediction versus actual, fixed baseline comparison.
- Interactive graph explorer: edge CSV, explicit isolated nodes, directed/undirected graphs, task selection, source/target inspection, real traversal/path highlights and all-pairs matrix.
- SQLite history with domain, predicted algorithm, date and profile filters, experiment drill-down, cumulative match rate and CSV export.
- Graceful invalid-input, unavailable-backend, skipped-run, timeout, failed-worker and cancellation states.

## Algorithms and DAA concepts

| Domain | Algorithms | Concepts demonstrated |
|---|---|---|
| Sorting | Insertion, Merge, Quick, Heap, Counting, Radix | Adaptive work, divide and conquer, recurrences, stability, in-place memory, comparison lower bounds, range/digit dependence |
| Searching | Linear, Binary, separate-chaining hash lookup | Preconditions, preprocessing, amortization across queries, collision worst cases, time-space trade-offs |
| Graph | BFS, DFS, Dijkstra, Bellman–Ford, Floyd–Warshall | Traversal, reachability, greedy shortest paths, negative edges/cycles, dynamic programming |

Quick Sort uses median-of-three and three-way partitioning with a bounded explicit stack. Counting Sort uses a stable prefix-count placement. Radix Sort uses base 256 and translates signed integers by the input minimum. Dijkstra uses Python's heap only as a priority queue; the shortest-path algorithm is implemented here. Search returns membership per query rather than ambiguous original indices after sorting.

Built-in sorting is used only for metadata/score rows and as an independent correctness oracle. No evaluated sorting algorithm calls `sorted()` or `.sort()`.

## Selection methodology

Filter hard constraints **before** scoring. The weights live in one config:

```text
score = 100 × (0.40 × complexity + 0.30 × dataset_fit
             + 0.15 × memory + 0.15 × history)
```

Complexity suitability is `sqrt(minimum eligible work estimate / candidate work estimate)`, bounded to [0,1]. Insertion uses `n + inversions`; Merge uses `n log₂ n`; Counting uses `n + k`; Radix uses digit passes and its base. Dataset fit uses structure, duplicates, range, task, and query workload. Memory policy and stability can exclude algorithms. Scores are **heuristics, not probabilities**. Constants and policy thresholds are explicit and unchanged across experiments.

Binary Search requires ordered data or explicit timed Merge Sort preprocessing. Hash lookup includes index construction. Dijkstra is excluded for negative edges. BFS shortest paths require every edge weight to be 1. Only Floyd–Warshall competes for the current all-pairs implementation. Counting allocation is guarded by k relative to n and an absolute bucket cap.

See [algorithm-selection.md](docs/algorithm-selection.md) for the complete scoring table and matching rules.

## Benchmark methodology

Identical copies → one discarded warmup → 1/3/5 timed instrumented trials → median `perf_counter_ns` duration → independent correctness verification → separate `tracemalloc` pass.

Every candidate runs in a spawned process with an 8-second budget, including worker startup, warmup, correctness, memory, and trials. The measured runtime itself excludes worker startup, copying the request, oracle, and memory tracing. Internal algorithm copies, adjacency/index construction, and opted-in preprocessing are included. Timeouts terminate workers. At most two jobs run at once. A job runs candidates sequentially.

Operations are comparisons + moves + visits; swaps count as two moves, recursion calls are reported separately. These are instrumented algorithm events, not CPU instructions. Peak memory is Python allocation tracing, not operating-system RSS or a direct proof of asymptotic auxiliary space.

The fixed sorting baseline is **always Quick Sort** where it is eligible and completes. Searching uses Linear Search; graph single-source uses Bellman–Ford. Traversal/all-pairs have no applicable fixed baseline here. Inapplicable or incomplete baselines are shown as unavailable. Gap = `(selected median / fastest completed median - 1) × 100`.

See [benchmarking.md](docs/benchmarking.md).

## Adaptive history

Four related SQLite tables preserve experiments, profiles, algorithm results, and repeated timings. Similarity is deterministic, based on input size and structure, with task/query constraints. A candidate's historical evidence uses the fastest measured time divided by its own time. Two neutral pseudo-observations shrink small samples:

`history score = (1 + sum(relative speeds)) / (2 + number of observations)`.

No evidence starts at 0.5. Use at most the latest 20 matches from the latest 100 experiments per domain. The history component always carries 15%. A mismatch is retained as evidence. This mechanism can change future choices; it does **not** guarantee continuously increasing accuracy.

## API overview

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health`, `/api/metadata` | Engine health, catalog and weights |
| POST | `/api/{domain}/trace/{algorithm}` | Verified execution frames for the supplied input |
| POST | `/api/{sorting,searching,graph}/analyze` | Input profile |
| POST | `/api/{sorting,searching,graph}/select` | Ranked scores and explanation |
| POST | `/api/{sorting,searching,graph}/benchmark` | Start job; returns HTTP 202 and `job_id` |
| GET | `/api/jobs/{id}` | State, progress, partial results, completed summary |
| POST | `/api/jobs/{id}/cancel` | Request worker cancellation |
| POST | `/api/complexity/empirical` | Start a bounded growth experiment |
| GET | `/api/history`, `/api/history/{id}` | Persisted summaries and complete measurement detail |

## Testing

From the project root:

```powershell
.\.venv\Scripts\python.exe -m pytest backend -q
cd frontend
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
# With both servers running:
npm.cmd exec playwright test
```

Playwright defaults to installed Microsoft Edge. For another platform, install Chromium with `npm.cmd exec playwright install chromium` and set `$env:PLAYWRIGHT_CHANNEL='chromium'` before testing. Browser tests execute real benchmarks against the running local database. Backend tests use isolated temporary databases.

Optional Python development tooling:

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
.\.venv\Scripts\python.exe -m ruff check backend
.\.venv\Scripts\python.exe -m ruff format --check backend
```

Verified: **102 backend tests, 6 browser journeys, production build, lint, type checks, and 5 reproducible API experiments.** See [testing.md](docs/testing.md) for measured results, notices, and test scope.

To reproduce the API demonstration with the backend running: `.\.venv\Scripts\python.exe scripts\demo.py your-input.json`. It saves actual trial data to `docs/demo-results.json`.

## Four-member contribution breakdown

| Member | Owns | Can demonstrate in the viva |
|---|---|---|
| 1 | Profiler + complexity engine | Inversion counting, distribution/range, graph density, metadata, growth curves and recurrences |
| 2 | Selection + explainability | Applicability constraints, scoring formula, component contributions, why/why-not traces |
| 3 | Algorithms + benchmark engine | Manual implementations, event counters, correctness oracles, isolated timing, memory, cancellation |
| 4 | Adaptive history + visualization | SQLite relations, similarity matching, shrinkage, prediction gap, charts and interactive paths |

## Demonstration

1. Paste or upload your own sorting input, inspect its profile and explain the recommendation.
2. Watch comparisons and moves in the visualizer; switch between eligible algorithms.
3. Run a benchmark and compare prediction with measured performance.
4. Switch to searching, enter targets, and inspect found/missing results; enable preprocessing to visualize Binary Search on unsorted data.
5. Paste or upload graph edges and follow traversal or distance updates. Select all-pairs to see the distance matrix evolve.
6. Use Complexity lab to measure increasing prefixes of your submitted dataset.
7. Inspect the saved experiment in History. Reanalyze the same input to see historical evidence influence the score.
