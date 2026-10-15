# Selection and explainability

## Hard constraints

Sorting accepts integers with absolute values ≤10¹². Stable mode rejects Quick/Heap. Limited-memory mode rejects Merge/Counting/Radix auxiliary arrays. Counting requires k≤200,000 and k≤max(256,32n). The signed Radix implementation translates by minimum and uses byte-sized stable counting passes.

Binary Search is eligible only when exact inversions are zero or preprocessing is explicitly allowed. In the latter case Merge Sort is part of timing and the estimated work. Limited memory excludes hash indexing and unsorted binary preprocessing.

Graph task filtering occurs first: traversal allows BFS/DFS; single-source shortest path allows BFS/Dijkstra/Bellman–Ford; all-pairs allows Floyd–Warshall. BFS shortest paths require every edge weight to equal 1. Dijkstra rejects any negative edge, including in an unreachable component, as a clear conservative rule. Graphs are capped at 80 vertices, bounding cubic work.

## Components

All components are in [0,1]; the final score is `100(0.40C + 0.30F + 0.15M + 0.15H)`. Weights are in `backend/app/core/config.py`. Candidate estimates use n=max(1,input size), L=max(1,log₂ n), I=exact inversions, k=range, r=duplicate ratio.

| Sorting algorithm | Work estimate | Dataset fit | Memory component |
|---|---|---|---|
| Insertion | n+I | max(.05,1−I/(nL)) | 1.00 |
| Merge | nL | .86 | .55 |
| Quick | nL(1−.6r) | .85+.1r | .92 |
| Heap | 2nL | .62 | 1.00 |
| Counting | n+k | max(.1,1−k/(16n)) | .45 |
| Radix | max(1,ceil(log₂(max(1,k))/8))×(n+256) | .80 at n≥512, else .45 | .50 |

C = sqrt(minimum eligible estimate / this estimate), capped at 1. The factors are explicit heuristic policy, not measured constants or fitted probabilities. Best/average/worst complexity metadata remains separate from these finite-input estimates.

Searching estimates: Linear max(1,qn/2), Binary max(1,qL + unsorted×nL), Hash n+q. One or two queries favor the linear fit; sorted data favors binary fit; many queries favor hash fit. Expected update frequency discounts ordered/indexed structure fit (binary ×.4; hash ×.7), while linear fit remains unchanged. Updates are a scenario parameter; measured runs contain the current query batch only.

Graph estimates: BFS/DFS V+E; Dijkstra (V+E)log₂V; Bellman–Ford V max(1,E); Floyd–Warshall V³. Task and weights are strict constraints. Dataset fit prioritizes the suitable task/weight model; graph-memory estimates describe the current adjacency and matrix implementations.

Tie-breaking is stable catalog order, making decisions deterministic for a fixed input, configuration and history snapshot. Scores can change after new measured evidence is stored; they are not guaranteed to improve.

## Profiling

Adjacent order = nondecreasing adjacent pairs / (n−1). This is **not** a claim that the whole array is sorted. Exact inversion counting uses a merge-based O(n log n) method. Disorder = I / (n(n−1)/2). Empty/singleton inputs have order 1, inversion count 0. Duplicates are non-inversions. Empty min/max are null. A 16-bin histogram covers the complete input; preview bars show the first 80 input values only.

Graph density excludes loops in its numerator and uses V(V−1) for directed or V(V−1)/2 for undirected graphs. Isolated node labels remain part of V. Negative-edge count is computed directly.

## Historical evidence

Consider at most the latest 100 experiments in the same domain. Size ratio must be between 1/2 and 2. Sorting/searching also require absolute disorder difference ≤.12, duplicate-ratio difference ≤.2, and a log₂ difference ≤2 in max(1,k/n). Searching additionally matches query count, expected updates, and preprocessing policy exactly. Graphs match task, directedness, weightedness, negative-edge presence and density within .2. Up to 20 matching experiments contribute.

For every successful candidate, relative speed = fastest successful median / candidate median. Historical component = `(1 + sum(relative speeds)) / (2 + candidate sample count)`. No candidate evidence is neutral .5. Failed or skipped algorithms contribute nothing. Explanations report actual candidate sample counts and the profile used, not prewritten claims about benchmark success.
