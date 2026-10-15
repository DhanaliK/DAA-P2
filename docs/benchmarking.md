# Benchmark contract

1. Freeze the current input and recommendation before execution.
2. Consider all eligible algorithms. Report an explicit skip for Insertion Sort above 2,000,000 inversions.
3. Spawn a separate process per algorithm. Workers do not receive the SQLite connection.
4. Discard one warmup. For each measured trial, deep-copy the request before starting the clock. Time the instrumented algorithm including its internal copies, index/adjacency building, and binary preprocessing.
5. Compute the median over 1–5 user-selected trials with `perf_counter_ns`.
6. Compare full sorting output with Python's `sorted()` oracle; compare membership answers with direct membership; check graph results against an independent synchronous relaxation/reachability oracle. The oracles are outside timing. Every algorithm also has edge-case unit tests.
7. Run an additional pass with `tracemalloc`. Report peak live Python allocations; do not add this duration to the median. Input transport copies are excluded, but the result and algorithm allocations are retained when reading the peak.
8. Send counters, bounded output preview, individual trial times and status over the pipe. The coordinator reads before joining and terminates on timeout/cancellation.
9. Save complete experiments transactionally; cancellation leaves partial measurements unsaved. A completed experiment may contain visible skipped/timeout/error candidates.

## What a result means

- Winner means the fastest **successful eligible** candidate in that experiment. Not all known algorithms, and not an asymptotic proof.
- Accuracy is whether selected equals measured winner, only when the selected algorithm finished correctly.
- Performance gap = `(selected time / fastest time − 1) × 100`.
- Aggregate baseline speedup = sum of valid baseline times / sum of selected times, over paired experiments only. Values below 1 mean the fixed baseline was faster.
- Sorting baseline Quick Sort, searching baseline Linear Search, graph single-source baseline Bellman–Ford. If the baseline is excluded or fails it is not compared. Traversal and all-pairs have no baseline here.
- Operations = comparisons + moves + visits; two moves per swap, not double-counting swap events. Recursion calls are separate. This deliberately makes the instrumentation definition visible rather than calling it CPU work.
- In-place metadata excludes the immutable-input benchmark wrapper and returned result. A standard in-place algorithm can therefore still have nonzero measured allocations.

## Guards and uncertainty

20,000 input values; 2,000 query values; 80 vertices; 2,000 edges; 200,000 Counting buckets; 2 active jobs; 64 retained live job snapshots; 8 seconds per worker including all passes. Empirical sweeps use 2–6 distinct increasing sizes in [2,4,000]. Workers terminate rather than holding an HTTP request open.

Runtime depends on Python version, instrumentation, distribution, collisions, memory layout, cache and system load. Low trial counts do not establish statistical significance. Graph demo timings may be microseconds and noisy. Multiple concurrent jobs are supported but interfere with clean measurement; use one job at a time for reported evaluation.

For a defensible evaluation, retain raw trials, rerun multiple seeds per shape/size, compare paired baseline times, and report mismatches and skips. Do not present the best observed run as a guaranteed outcome.
