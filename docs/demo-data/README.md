# AlgoAdapt demonstration data

29 valid demonstration cases, 3 equivalent upload formats, and 8 deliberately invalid files. All 36 listed algorithm playbacks were executed and their outputs verified. The application parser also checked all 20 numeric case files, the 3 equivalent formats, and the 6 invalid numeric samples. These are optional static input files; nothing has been added to the application’s input generator or auto-loaded.

## Before presenting

- Open Algorithm studio for sorting/searching; paste the data or upload the corresponding CSV. Numeric files contain no column headings. Upload fills the editor: click **Analyze input** afterward.
- For searching, paste the listed targets into **Numbers to search for**. Do not upload the `-queries.txt` file into the dataset field.
- Start each independent case with Memory policy **Balanced**, stable-sort requirement **off**, expected updates **0**, and Binary Search preprocessing **off**, except where specified. You can refresh to clear all current inputs and settings; completed history remains.
- Click **Watch this algorithm step by step**. Choose the listed algorithm in **Visualize algorithm**, then Play or Next step. This selector changes playback; the rule-based recommendation and benchmark comparison remain separate.
- The baseline recommendations below use neutral history. Your saved experiments can change rankings. Playback output is deterministic for the listed inputs/settings, but measured times and fastest algorithms can vary.
- For graphs: use Graph explorer → Edit / upload graph. Clear old node labels or replace them with the labels listed for the case. Old labels are otherwise retained as isolated nodes. Paste/upload edges, Apply graph, and set the specified task, source, and Directed setting. Graph files support the `source,target,weight` header.
- A standalone isolated vertex uses the Node labels field; a CSV with only a header has no vertices.

## Suggested 8–10 minute route

1. Mixed sorting → Quick Sort: pivot, comparison, swap.
2. Nearly sorted → Insertion Sort: one inversion and few shifts.
3. Small range → Counting Sort: range versus number of values.
4. Sorted search → Binary Search: narrowing bounds; unsorted case → preprocessing requirement.
5. Hash collisions: an absent query scans the collision chain.
6. Positive graph → Dijkstra; change to the negative-edge graph → Bellman–Ford.
7. Floyd–Warshall → evolving matrix; negative cycle → explain why no finite answer exists.
8. Run a benchmark, inspect History, and optionally show Complexity lab using the 80-value file.

## Quick case index

| Case | File | Playback to show | Baseline recommendation |
|---|---|---|---|
| Mixed values: Quick Sort | [sorting/01-mixed.csv](sorting/01-mixed.csv) | Quick Sort | Quick Sort |
| Nearly sorted: Insertion Sort | [sorting/02-nearly-sorted.csv](sorting/02-nearly-sorted.csv) | Insertion Sort | Insertion Sort |
| Reverse order: compare Insertion and Merge | [sorting/03-reverse.csv](sorting/03-reverse.csv) | Insertion Sort, Merge Sort | Quick Sort |
| Small range: Counting Sort | [sorting/04-small-range.csv](sorting/04-small-range.csv) | Counting Sort | Counting Sort |
| Duplicate-heavy input | [sorting/05-duplicates.csv](sorting/05-duplicates.csv) | Quick Sort, Counting Sort | Quick Sort |
| Multiple digit passes: Radix Sort | [sorting/06-radix.csv](sorting/06-radix.csv) | Radix Sort | Quick Sort |
| Negative values and zero | [sorting/07-signed.csv](sorting/07-signed.csv) | Merge Sort, Radix Sort | Quick Sort |
| Huge numeric range | [sorting/08-wide-range.csv](sorting/08-wide-range.csv) | Quick Sort, Heap Sort | Quick Sort |
| Require stable ordering | [sorting/09-stable.csv](sorting/09-stable.csv) | Merge Sort | Merge Sort |
| Limited memory: Heap Sort | [sorting/10-memory.csv](sorting/10-memory.csv) | Heap Sort | Quick Sort |
| Already sorted | [sorting/11-sorted.csv](sorting/11-sorted.csv) | Insertion Sort | Insertion Sort |
| All values equal | [sorting/12-all-equal.csv](sorting/12-all-equal.csv) | Quick Sort, Insertion Sort | Insertion Sort |
| Single element | [sorting/13-singleton.csv](sorting/13-singleton.csv) | Merge Sort | Insertion Sort |
| Linear: early hit, late hit, and miss | [searching/01-linear.csv](searching/01-linear.csv) | Linear Search | Hash Search |
| Binary: already sorted input | [searching/02-binary.csv](searching/02-binary.csv) | Binary Search | Binary Search |
| Binary: unsorted input | [searching/03-preprocessing.csv](searching/03-preprocessing.csv) | Binary Search | Linear Search |
| Hash: many membership queries | [searching/04-hash.csv](searching/04-hash.csv) | Hash Search | Hash Search |
| Hash: deliberate collision chain | [searching/05-collisions.csv](searching/05-collisions.csv) | Hash Search | Binary Search |
| Search duplicates and negative targets | [searching/06-duplicates.csv](searching/06-duplicates.csv) | Linear Search, Hash Search | Hash Search |
| BFS versus DFS | [graph/01-traversal.csv](graph/01-traversal.csv) | BFS, DFS | BFS |
| BFS shortest paths | [graph/02-unweighted.csv](graph/02-unweighted.csv) | BFS | BFS |
| Positive weights: Dijkstra | [graph/03-dijkstra.csv](graph/03-dijkstra.csv) | Dijkstra | Dijkstra |
| Negative edge: Bellman–Ford | [graph/04-negative-edge.csv](graph/04-negative-edge.csv) | Bellman–Ford | Bellman–Ford |
| All pairs: Floyd–Warshall | [graph/05-all-pairs.csv](graph/05-all-pairs.csv) | Floyd–Warshall | Floyd–Warshall |
| Unreachable and isolated nodes | [graph/06-disconnected.csv](graph/06-disconnected.csv) | Dijkstra | Dijkstra |
| Reachable negative cycle | [graph/07-negative-cycle.csv](graph/07-negative-cycle.csv) | Bellman–Ford | Bellman–Ford |
| Undirected weighted graph | [graph/08-undirected.csv](graph/08-undirected.csv) | Dijkstra | Dijkstra |
| One isolated vertex | [graph/09-isolated-single.csv](graph/09-isolated-single.csv) | BFS | BFS |
| Complexity lab: five real prefixes | [sorting/14-complexity-80.csv](sorting/14-complexity-80.csv) | Merge Sort | Counting Sort |

## Sorting cases

### 01-mixed: Mixed values: Quick Sort

Upload: [sorting/01-mixed.csv](sorting/01-mixed.csv)

Pause at the pivot and explain comparisons and swaps. Duplicates are grouped by the three-way partition.

```text
38, 12, 71, 5, 24, 12, 90, 3, 45, 18
```

**Baseline recommendation:** Quick Sort. Select **Quick Sort** for the intended playback.

**Profile:** 10 values, 9 unique, 23 inversions, integer range 88.

**Verified sorted output:** `3, 5, 12, 12, 18, 24, 38, 45, 71, 90`

### 02-nearly-sorted: Nearly sorted: Insertion Sort

Upload: [sorting/02-nearly-sorted.csv](sorting/02-nearly-sorted.csv)

Only 30 and 25 are out of order: exactly one inversion. Very little shifting is needed.

```text
5, 10, 15, 20, 30, 25, 35, 40, 45, 50
```

**Baseline recommendation:** Insertion Sort. Select **Insertion Sort** for the intended playback.

**Profile:** 10 values, 10 unique, 1 inversions, integer range 46.

**Verified sorted output:** `5, 10, 15, 20, 25, 30, 35, 40, 45, 50`

### 03-reverse: Reverse order: compare Insertion and Merge

Upload: [sorting/03-reverse.csv](sorting/03-reverse.csv)

There are 66 inversions. Show repeated shifts, then compare divide-and-merge steps on exactly the same input.

```text
60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5
```

**Baseline recommendation:** Quick Sort. Select **Insertion Sort, Merge Sort** for the intended playback.

**Profile:** 12 values, 12 unique, 66 inversions, integer range 56.

**Verified sorted output:** `5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60`

### 04-small-range: Small range: Counting Sort

Upload: [sorting/04-small-range.csv](sorting/04-small-range.csv)

Forty values occupy just five integer buckets (0 to 4). Explain count, prefix count, and output placement.

```text
3, 1, 4, 0, 2, 1, 3, 4, 2, 0, 4, 1, 2, 3, 0, 2, 4, 1, 0, 3, 1, 4, 2, 0, 3, 2, 1, 4, 3, 0, 4, 2, 0, 1, 3, 1, 2, 4, 0, 3
```

**Baseline recommendation:** Counting Sort. Select **Counting Sort** for the intended playback.

**Profile:** 40 values, 5 unique, 326 inversions, integer range 5.

**Verified sorted output:** `0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4`

### 05-duplicates: Duplicate-heavy input

Upload: [sorting/05-duplicates.csv](sorting/05-duplicates.csv)

Only three distinct values. Compare the Quick Sort equal-pivot partition with Counting Sort buckets.

```text
7, 3, 7, 7, 2, 3, 7, 2, 7, 3, 2, 7
```

**Baseline recommendation:** Quick Sort. Select **Quick Sort, Counting Sort** for the intended playback.

**Profile:** 12 values, 3 unique, 27 inversions, integer range 6.

**Verified sorted output:** `2, 2, 2, 3, 3, 3, 7, 7, 7, 7, 7, 7`

### 06-radix: Multiple digit passes: Radix Sort

Upload: [sorting/06-radix.csv](sorting/06-radix.csv)

This implementation uses base 256, not decimal digits. Watch the passes at places 1 and 256; values are displayed with the signed offset restored.

```text
170, 45, 750, 90, 802, 24, 2, 66, 4096, 256
```

**Baseline recommendation:** Quick Sort. Select **Radix Sort** for the intended playback.

**Profile:** 10 values, 10 unique, 21 inversions, integer range 4095.

**Verified sorted output:** `2, 24, 45, 66, 90, 170, 256, 750, 802, 4096`

**Excluded candidates:** Counting Sort: Range k=4,095 exceeds the 200,000-bucket or 32n allocation guard (minimum allowance 256).

### 07-signed: Negative values and zero

Upload: [sorting/07-signed.csv](sorting/07-signed.csv)

Negative numbers are valid. Merge compares normally; Radix translates by the minimum, sorts digits, and restores the offset.

```text
-12, 7, 0, -3, 15, -12, 4, -1
```

**Baseline recommendation:** Quick Sort. Select **Merge Sort, Radix Sort** for the intended playback.

**Profile:** 8 values, 7 unique, 13 inversions, integer range 28.

**Verified sorted output:** `-12, -12, -3, -1, 0, 4, 7, 15`

### 08-wide-range: Huge numeric range

Upload: [sorting/08-wide-range.csv](sorting/08-wide-range.csv)

Counting Sort is excluded by its allocation guard. Explain why seven elements can still require an enormous count array.

```text
1000000, -500000, 42, 999999, 0, -2, 750000
```

**Baseline recommendation:** Quick Sort. Select **Quick Sort, Heap Sort** for the intended playback.

**Profile:** 7 values, 7 unique, 12 inversions, integer range 1500001.

**Verified sorted output:** `-500000, -2, 0, 42, 750000, 999999, 1000000`

**Excluded candidates:** Counting Sort: Range k=1,500,001 exceeds the 200,000-bucket or 32n allocation guard (minimum allowance 256).

### 09-stable: Require stable ordering

Upload: [sorting/09-stable.csv](sorting/09-stable.csv)

Enable Require a stable sort. Quick and Heap are excluded. Equal plain integers have no record identity, so this UI demonstrates eligibility, not a visible proof of stability.

```text
42, 7, 42, 3, 19, 7, 30, 3
```

**Set `stable` to `True`.**

**Baseline recommendation:** Merge Sort. Select **Merge Sort** for the intended playback.

**Profile:** 8 values, 5 unique, 17 inversions, integer range 40.

**Verified sorted output:** `3, 3, 7, 7, 19, 30, 42, 42`

**Excluded candidates:** Quick Sort: Stable ordering is required; this implementation is unstable.; Heap Sort: Stable ordering is required; this implementation is unstable.

### 10-memory: Limited memory: Heap Sort

Upload: [sorting/10-memory.csv](sorting/10-memory.csv)

Set Memory policy to Limited auxiliary memory. Merge, Counting, and Radix are excluded; select Heap to explain parent/child comparisons and the sorted suffix.

```text
48, 15, 32, 7, 61, 24, 3, 56, 19, 40
```

**Set `memory` to `limited`.**

**Baseline recommendation:** Quick Sort. Select **Heap Sort** for the intended playback.

**Profile:** 10 values, 10 unique, 23 inversions, integer range 59.

**Verified sorted output:** `3, 7, 15, 19, 24, 32, 40, 48, 56, 61`

**Excluded candidates:** Merge Sort: Limited-memory mode excludes linear auxiliary arrays.; Counting Sort: Limited-memory mode excludes linear auxiliary arrays.; Radix Sort: Limited-memory mode excludes linear auxiliary arrays.

### 11-sorted: Already sorted

Upload: [sorting/11-sorted.csv](sorting/11-sorted.csv)

Zero inversions. Insertion Sort stops each comparison loop without shifting earlier values.

```text
2, 4, 6, 8, 10, 12, 14, 16
```

**Baseline recommendation:** Insertion Sort. Select **Insertion Sort** for the intended playback.

**Profile:** 8 values, 8 unique, 0 inversions, integer range 15.

**Verified sorted output:** `2, 4, 6, 8, 10, 12, 14, 16`

### 12-all-equal: All values equal

Upload: [sorting/12-all-equal.csv](sorting/12-all-equal.csv)

The range is one and there are zero inversions. Quick Sort consumes one equal-pivot group; do not claim a universal timing winner.

```text
9, 9, 9, 9, 9, 9, 9, 9
```

**Baseline recommendation:** Insertion Sort. Select **Quick Sort, Insertion Sort** for the intended playback.

**Profile:** 8 values, 1 unique, 0 inversions, integer range 1.

**Verified sorted output:** `9, 9, 9, 9, 9, 9, 9, 9`

### 13-singleton: Single element

Upload: [sorting/13-singleton.csv](sorting/13-singleton.csv)

An immediate base case: start and completed frames, with no meaningful sorting work.

```text
42
```

**Baseline recommendation:** Insertion Sort. Select **Merge Sort** for the intended playback.

**Profile:** 1 values, 1 unique, 0 inversions, integer range 1.

**Verified sorted output:** `42`

### 14-complexity-80: Complexity lab: five real prefixes

Upload: [sorting/14-complexity-80.csv](sorting/14-complexity-80.csv)

Analyze these 80 supplied values in Sorting, then open Complexity lab and choose Merge Sort. The five measured prefixes contain 16, 32, 48, 64, and 80 values. Small runtime differences can be noisy; use the Operations metric to discuss growth.

```text
38, 12, 71, 5, 24, 12, 90, 3, 45, 18, 63, 9, 52, 31, 7, 84, 26, 40, 11, 68, 2, 57, 35, 79, 14, 46, 22, 95, 6, 61, 33, 17, 88, 4, 50, 28, 73, 10, 43, 65, 19, 82, 1, 54, 30, 76, 13, 48, 21, 92, 8, 59, 37, 69, 16, 44, 25, 87, 15, 62, 32, 77, 20, 55, 29, 93, 23, 66, 36, 81, 27, 49, 34, 74, 39, 58, 41, 86, 47, 70
```

**Baseline recommendation:** Counting Sort. Select **Merge Sort** for the intended playback.

**Profile:** 80 values, 79 unique, 1308 inversions, integer range 95.

**Verified sorted output:** `1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 43, 44, 45, 46, 47, 48, 49, 50, 52, 54, 55, 57, 58, 59, 61, 62, 63, 65, 66, 68, 69, 70, 71, 73, 74, 76, 77, 79, 81, 82, 84, 86, 87, 88, 90, 92, 93, 95`


## Searching cases

### 01-linear: Linear: early hit, late hit, and miss

Upload: [searching/01-linear.csv](searching/01-linear.csv)

Trace every comparison. Targets 18, 12, and 99 respectively hit first, hit last, and scan the whole list without a match.

```text
18, 7, 31, 4, 25, 12
```

**Search targets:** `18, 12, 99`

**Baseline recommendation:** Hash Search. Select **Linear Search** for the intended playback.

**Verified query results:** `18` → **Found**; `12` → **Found**; `99` → **Not found**.

**Excluded candidates:** Binary Search: Input is unsorted. Enable sort preprocessing to make Binary Search applicable.

### 02-binary: Binary: already sorted input

Upload: [searching/02-binary.csv](searching/02-binary.csv)

No preprocessing is needed. Show low, mid, and high moving inward. All 32 values fit in playback.

```text
3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96
```

**Search targets:** `3, 24, 48, 72, 96, 1, 97, 33`

**Baseline recommendation:** Binary Search. Select **Binary Search** for the intended playback.

**Verified query results:** `3` → **Found**; `24` → **Found**; `48` → **Found**; `72` → **Found**; `96` → **Found**; `1` → **Not found**; `97` → **Not found**; `33` → **Found**.

### 03-preprocessing: Binary: unsorted input

Upload: [searching/03-preprocessing.csv](searching/03-preprocessing.csv)

First leave preprocessing off: Binary is excluded. Then enable Allow sorting before Binary Search. Watch Merge Sort followed by midpoint checks.

```text
45, 12, 78, 3, 29, 60, 8, 91, 17, 36
```

**Search targets:** `29, 91, 100`

**Set `allow_preprocessing` to `True`.**

**Baseline recommendation:** Linear Search. Select **Binary Search** for the intended playback.

**Verified query results:** `29` → **Found**; `91` → **Found**; `100` → **Not found**.

### 04-hash: Hash: many membership queries

Upload: [searching/04-hash.csv](searching/04-hash.csv)

Eight targets amortize index construction. Explain the build phase and then query buckets. Index construction is included in benchmarks.

```text
41, 7, 89, 23, 56, 12, 94, 3, 68, 35, 17, 80, 29, 62, 5, 47
```

**Search targets:** `7, 89, 5, 47, 100, 0, 62, 41`

**Baseline recommendation:** Hash Search. Select **Hash Search** for the intended playback.

**Verified query results:** `7` → **Found**; `89` → **Found**; `5` → **Found**; `47` → **Found**; `100` → **Not found**; `0` → **Not found**; `62` → **Found**; `41` → **Found**.

**Excluded candidates:** Binary Search: Input is unsorted. Enable sort preprocessing to make Binary Search applicable.

### 05-collisions: Hash: deliberate collision chain

Upload: [searching/05-collisions.csv](searching/05-collisions.csv)

Six values create 13 buckets (2n+1). Every value lands in bucket 1. Target 79 also hashes to 1 but is absent; the entire chain is checked.

```text
1, 14, 27, 40, 53, 66
```

**Search targets:** `27, 79, 66`

**Baseline recommendation:** Binary Search. Select **Hash Search** for the intended playback.

**Verified query results:** `27` → **Found**; `79` → **Not found**; `66` → **Found**.

### 06-duplicates: Search duplicates and negative targets

Upload: [searching/06-duplicates.csv](searching/06-duplicates.csv)

Membership returns Found or Not found per query, not a duplicate count or original index.

```text
-5, 3, -5, 8, 0, 3, 12
```

**Search targets:** `-5, 3, 99, 0`

**Baseline recommendation:** Hash Search. Select **Linear Search, Hash Search** for the intended playback.

**Verified query results:** `-5` → **Found**; `3` → **Found**; `99` → **Not found**; `0` → **Found**.

**Excluded candidates:** Binary Search: Input is unsorted. Enable sort preprocessing to make Binary Search applicable.


## Graphs cases

### 01-traversal: BFS versus DFS

Upload: [graph/01-traversal.csv](graph/01-traversal.csv)

Set task to Traversal / reachability. BFS explores by queue layers; DFS follows a branch and backtracks. Order depends on the listed edge order.

**Settings:** task `traversal`; source `A`; Directed **ON**.
**Node labels:** `A, B, C, D, E, F, G`

```csv
source,target,weight
A,B,1
A,C,1
B,D,1
B,E,1
C,F,1
F,G,1
```

**Baseline recommendation:** BFS. Select **BFS, DFS** for the intended playback.

**Verified BFS output:**

```json
{
  "order": [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G"
  ],
  "distances": {
    "A": 0,
    "B": 1,
    "C": 1,
    "D": 2,
    "E": 2,
    "F": 2,
    "G": 3
  },
  "parents": {
    "B": "A",
    "C": "A",
    "D": "B",
    "E": "B",
    "F": "C",
    "G": "F"
  }
}
```

**Verified DFS output:**

```json
{
  "order": [
    "A",
    "B",
    "D",
    "E",
    "C",
    "F",
    "G"
  ],
  "distances": {
    "A": 0,
    "B": 1,
    "C": 1,
    "D": 2,
    "E": 2,
    "F": 2,
    "G": 3
  },
  "parents": {
    "B": "A",
    "D": "B",
    "E": "B",
    "C": "A",
    "F": "C",
    "G": "F"
  }
}
```

**Excluded candidates:** Dijkstra: Task is traversal; only BFS and DFS are candidates.; Bellman–Ford: Task is traversal; only BFS and DFS are candidates.; Floyd–Warshall: Task is traversal; only BFS and DFS are candidates.

### 02-unweighted: BFS shortest paths

Upload: [graph/02-unweighted.csv](graph/02-unweighted.csv)

Set Single-source shortest path. Every weight is 1, so BFS gives shortest distances in edge counts. A to G takes three edges.

**Settings:** task `single-source`; source `A`; Directed **ON**.
**Node labels:** `A, B, C, D, E, F, G`

```csv
source,target,weight
A,B,1
A,C,1
B,D,1
B,E,1
C,F,1
F,G,1
```

**Baseline recommendation:** BFS. Select **BFS** for the intended playback.

**Verified BFS output:**

```json
{
  "order": [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G"
  ],
  "distances": {
    "A": 0,
    "B": 1,
    "C": 1,
    "D": 2,
    "E": 2,
    "F": 2,
    "G": 3
  },
  "parents": {
    "B": "A",
    "C": "A",
    "D": "B",
    "E": "B",
    "F": "C",
    "G": "F"
  }
}
```

**Excluded candidates:** Depth-first Search: This algorithm does not match the single-source shortest-path task.; Floyd–Warshall: This algorithm does not match the single-source shortest-path task.

### 03-dijkstra: Positive weights: Dijkstra

Upload: [graph/03-dijkstra.csv](graph/03-dijkstra.csv)

Watch B improve from 4 to 3 through C. The shortest route A → C → B → D → E has distance 7.

**Settings:** task `single-source`; source `A`; Directed **ON**.
**Node labels:** `A, B, C, D, E`

```csv
source,target,weight
A,B,4
A,C,1
C,B,2
B,D,1
C,D,5
D,E,3
C,E,10
```

**Baseline recommendation:** Dijkstra. Select **Dijkstra** for the intended playback.

**Verified Dijkstra output:**

```json
{
  "distances": {
    "A": 0,
    "B": 3,
    "C": 1,
    "D": 4,
    "E": 7
  },
  "parents": {
    "B": "C",
    "C": "A",
    "D": "B",
    "E": "D"
  }
}
```

**Excluded candidates:** Breadth-first Search: BFS shortest paths require every edge weight to be 1.; Depth-first Search: This algorithm does not match the single-source shortest-path task.; Floyd–Warshall: This algorithm does not match the single-source shortest-path task.

### 04-negative-edge: Negative edge: Bellman–Ford

Upload: [graph/04-negative-edge.csv](graph/04-negative-edge.csv)

Keep Directed enabled. Dijkstra is excluded. The route A → C → B → D → E has distance 3; this graph has no negative cycle.

**Settings:** task `single-source`; source `A`; Directed **ON**.
**Node labels:** `A, B, C, D, E`

```csv
source,target,weight
A,B,4
A,C,1
C,B,-2
B,D,1
C,D,5
D,E,3
C,E,10
```

**Baseline recommendation:** Bellman–Ford. Select **Bellman–Ford** for the intended playback.

**Verified Bellman–Ford output:**

```json
{
  "distances": {
    "A": 0,
    "B": -1,
    "C": 1,
    "D": 0,
    "E": 3
  },
  "parents": {
    "B": "C",
    "C": "A",
    "D": "B",
    "E": "D"
  },
  "negative_cycle": false
}
```

**Excluded candidates:** Breadth-first Search: BFS shortest paths require every edge weight to be 1.; Depth-first Search: This algorithm does not match the single-source shortest-path task.; Dijkstra: 1 negative edges violate Dijkstra's non-negative-weight requirement.; Floyd–Warshall: This algorithm does not match the single-source shortest-path task.

### 05-all-pairs: All pairs: Floyd–Warshall

Upload: [graph/05-all-pairs.csv](graph/05-all-pairs.csv)

Set task to All-pairs shortest paths. Watch the A→C distance improve from 10 to 5 via B and other entries update.

**Settings:** task `all-pairs`; source `A`; Directed **ON**.
**Node labels:** `A, B, C`

```csv
source,target,weight
A,B,3
A,C,10
B,C,2
C,A,4
```

**Baseline recommendation:** Floyd–Warshall. Select **Floyd–Warshall** for the intended playback.

**Verified Floyd–Warshall output:**

```json
{
  "all_pairs": {
    "A": {
      "A": 0,
      "B": 3,
      "C": 5
    },
    "B": {
      "A": 6,
      "B": 0,
      "C": 2
    },
    "C": {
      "A": 4,
      "B": 7,
      "C": 0
    }
  },
  "negative_cycle": false
}
```

**Excluded candidates:** Breadth-first Search: All-pairs task requires an all-pairs implementation. BFS shortest paths require every edge weight to be 1.; Depth-first Search: All-pairs task requires an all-pairs implementation.; Dijkstra: All-pairs task requires an all-pairs implementation.; Bellman–Ford: All-pairs task requires an all-pairs implementation.

### 06-disconnected: Unreachable and isolated nodes

Upload: [graph/06-disconnected.csv](graph/06-disconnected.csv)

Explicitly enter node labels A, B, C, D, Z. Starting at A reaches B, while C, D, and isolated Z remain ∞.

**Settings:** task `single-source`; source `A`; Directed **ON**.
**Node labels:** `A, B, C, D, Z`

```csv
source,target,weight
A,B,2
C,D,1
```

**Baseline recommendation:** Dijkstra. Select **Dijkstra** for the intended playback.

**Verified Dijkstra output:**

```json
{
  "distances": {
    "A": 0,
    "B": 2,
    "C": null,
    "D": null,
    "Z": null
  },
  "parents": {
    "B": "A"
  }
}
```

**Excluded candidates:** Breadth-first Search: BFS shortest paths require every edge weight to be 1.; Depth-first Search: This algorithm does not match the single-source shortest-path task.; Floyd–Warshall: This algorithm does not match the single-source shortest-path task.

### 07-negative-cycle: Reachable negative cycle

Upload: [graph/07-negative-cycle.csv](graph/07-negative-cycle.csv)

Keep Directed enabled. The cycle total is −1. The correct result is a negative-cycle message, not a finite shortest distance.

**Settings:** task `single-source`; source `A`; Directed **ON**.
**Node labels:** `A, B, C`

```csv
source,target,weight
A,B,1
B,C,-3
C,A,1
```

**Baseline recommendation:** Bellman–Ford. Select **Bellman–Ford** for the intended playback.

**Verified Bellman–Ford output:**

```json
{
  "negative_cycle": true
}
```

**Excluded candidates:** Breadth-first Search: BFS shortest paths require every edge weight to be 1.; Depth-first Search: This algorithm does not match the single-source shortest-path task.; Dijkstra: 1 negative edges violate Dijkstra's non-negative-weight requirement.; Floyd–Warshall: This algorithm does not match the single-source shortest-path task.

### 08-undirected: Undirected weighted graph

Upload: [graph/08-undirected.csv](graph/08-undirected.csv)

Turn Directed OFF after applying the graph. List each undirected connection only once. From A, distances are B=4, C=6, D=7.

**Settings:** task `single-source`; source `A`; Directed **OFF**.
**Node labels:** `A, B, C, D`

```csv
source,target,weight
A,B,4
B,C,2
A,C,10
C,D,1
```

**Baseline recommendation:** Dijkstra. Select **Dijkstra** for the intended playback.

**Verified Dijkstra output:**

```json
{
  "distances": {
    "A": 0,
    "B": 4,
    "C": 6,
    "D": 7
  },
  "parents": {
    "B": "A",
    "C": "B",
    "D": "C"
  }
}
```

**Excluded candidates:** Breadth-first Search: BFS shortest paths require every edge weight to be 1.; Depth-first Search: This algorithm does not match the single-source shortest-path task.; Floyd–Warshall: This algorithm does not match the single-source shortest-path task.

### 09-isolated-single: One isolated vertex

Upload: [graph/09-isolated-single.csv](graph/09-isolated-single.csv)

Enter node label A and leave the edge list empty. Apply graph, then select Traversal. The only visited node is A.

**Settings:** task `traversal`; source `A`; Directed **ON**.
**Node labels:** `A`

```csv
source,target,weight
```

**Baseline recommendation:** BFS. Select **BFS** for the intended playback.

**Verified BFS output:**

```json
{
  "order": [
    "A"
  ],
  "distances": {
    "A": 0
  },
  "parents": {}
}
```

**Excluded candidates:** Dijkstra: Task is traversal; only BFS and DFS are candidates.; Bellman–Ford: Task is traversal; only BFS and DFS are candidates.; Floyd–Warshall: Task is traversal; only BFS and DFS are candidates.

## Paste / upload formats

These three files all become exactly `[38, 12, 71, 5, 24, 12]` in the parsed preview. There are six elements and nine inversions. A table is flattened row by row; the application does not choose spreadsheet columns.

- [Column TXT](formats/column.txt)
- [Tab-separated table](formats/table.tsv) — paste the contents; the file picker advertises CSV/TXT/JSON.
- [JSON array](formats/array.json)

## Deliberately invalid inputs

Use these only when showing validation. Afterward replace the invalid input and analyze again; a draft must not reuse the previous recommendation.

| File | Expected behavior |
|---|---|
| [text-value.txt](invalid/text-value.txt) | Reject non-numeric cells. |
| [empty-csv-cell.csv](invalid/empty-csv-cell.csv) | Reject empty CSV cells. |
| [decimal.txt](invalid/decimal.txt) | Reject decimals; only integers are supported. |
| [numeric-header.csv](invalid/numeric-header.csv) | Reject a column header in numeric data. |
| [malformed-array.json](invalid/malformed-array.json) | Reject malformed JSON. |
| [out-of-range.txt](invalid/out-of-range.txt) | Reject values outside ±10^12. |
| [duplicate-graph-edge.csv](invalid/duplicate-graph-edge.csv) | Apply graph rejects duplicate endpoint pairs. |
| [fractional-edge.csv](invalid/fractional-edge.csv) | Reject graph weights that are not integers. |

A blank numeric input should keep Analyze disabled. Searching without target numbers prompts for targets. An empty graph cannot be applied without at least one node label.

## Limits and presentation notes

- Every regular case here fits visual playback (≤80 numbers, ≤8 search targets, ≤16 nodes and ≤60 edges).
- Sorting/searching supports only integer lists. Stability cannot be visually proven using unlabeled equal numbers, and membership search does not report duplicate counts.
- The 80-value complexity case yields prefixes 16, 32, 48, 64, 80. Discuss operation growth; these tiny timings do not establish asymptotic complexity.
- Playback speed is not runtime. Benchmark results are measured separately and can change with load.
- Benchmarking these samples writes real experiment history and can influence later recommendations. No benchmark history was written while preparing this pack.
- `cases.json` is the full case manifest, not a numeric upload file. `verified-results.json` records checked outputs and frame counts.
