# Verification report

Updated 7 October 2026 (Asia/Calcutta). Python 3.10, Node.js 22, Microsoft Edge on Windows.

## Current checks

- **130 backend tests passed**, including 28 new visual-trace cases.
- Ruff lint and formatting passed.
- Next.js production build and ESLint passed; TypeScript checked by the production build.
- **9 browser journeys passed** in the final full run. They cover empty starting states, absence of generator requests, paste previews, invalid drafts, upload, animation controls, real benchmarking/history, graph tasks, empirical prefixes, mobile width, extension hydration, sidebar sizing, and missing-job recovery.

Trace cases verify all six sorting algorithms, all three searching algorithms, and all five graph algorithms. Recorded and unrecorded execution must produce identical outputs and operation counters. Tests include signed/duplicate/singleton values, absent search targets, disconnected vertices, negative cycles, ineligible algorithms, and playback size limits. Existing algorithm, selector, worker timeout/cancellation, history and API validation tests remain in the suite.

Browser checks use real API execution except the deliberate missing-job response used by the recovery test. An initial search-result assertion omitted rendered whitespace; the assertion was corrected to match the displayed found/missing labels. Screenshots are in `docs/visual-sorting.png`, `visual-search.png`, `visual-graph.png`, and `visual-mobile.png`.

## Re-run

```powershell
.\.venv\Scripts\python.exe -m pytest backend -q
.\.venv\Scripts\python.exe -m ruff check backend
.\.venv\Scripts\python.exe -m ruff format --check backend
cd frontend
npm.cmd run build
npm.cmd run lint
npm.cmd run typecheck
# With backend:8000 and frontend:3000 running:
npm.cmd run test:e2e
```

Only one frontend should use port 3000. The scripts explicitly select that port. Browser tests add real completed benchmark records to the local database. Legacy `demo-results.json` and earlier benchmark screenshots are historical evidence from the former generator workflow; current runs use only provided input. Existing history is preserved.

Known tool notices: Starlette's test client reports an httpx integration deprecation, and Playwright's Node process reports inherited NO_COLOR/FORCE_COLOR settings. These did not prevent passing checks.
