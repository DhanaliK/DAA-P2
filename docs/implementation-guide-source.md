# AlgoAdapt Implementation and Viva Guide
Technical explanation and presentation preparation

AlgoAdapt recommends algorithms from the properties of a supplied dataset, explains its reasoning, visualizes real execution steps, and checks the recommendation through measured benchmarks. This guide connects every major claim to the current implementation so that you can explain what happens, why it happens, and where the design has limits.

## Your one minute explanation
Our project addresses algorithm selection. The user chooses a task and supplies data. We validate the input, measure properties such as size, order, duplicates, value range, or graph weights, and exclude algorithms that violate prerequisites or user constraints. We rank eligible algorithms using estimated work, data fit, memory, and similar past experiments. The user can inspect the explanation and watch the chosen algorithm execute. A separate benchmark runs eligible algorithms on identical input, verifies their outputs, measures time and memory, and records evidence for later recommendations.

The contribution is an explainable selection and evaluation framework. The individual sorting, searching, and graph algorithms are established algorithms implemented in this project. The system is rule based with historical feedback; it is not a trained machine learning model and does not guarantee the fastest algorithm on every input.

## How to study this guide
Read sections 1–6 for the complete system logic, sections 7–13 for the algorithms, and sections 14–18 for implementation and demonstration. Sections 19–23 contain 40 viva questions with direct answers. Finish with the revision sheet and source map in sections 24–25.

For any algorithm, explain five things in order: the problem it solves, its input requirements, its main operation, why its result is correct, and its time and space costs. Then connect it to our selector. This reasoning pattern is more useful than memorizing a claim that one algorithm is always best.

Implementation baseline: local AlgoAdapt project in D:\college\Sem_5\DAA\P2. Prepared 13 October 2026. Source identifiers such as S1 refer to the source map in section 25. Sections 26–27 explain the four score components in plain language and examine your actual Quick versus Insertion benchmark.

<!-- PAGE -->
# 1 System architecture and data flow

The application has three main layers. The browser handles interaction and presentation. The Python backend validates requests, profiles input, selects algorithms, records traces, and coordinates benchmarks. SQLite stores completed experiment evidence. [S1–S8]

| Layer | Technology | Responsibility |
| Browser | Next.js and React with TypeScript | Input drafts, navigation, explanations, playback, charts and job polling |
| API | FastAPI and Pydantic | JSON routes, strict validation, profiles and selection responses |
| Algorithm engine | Python implementations | Six sorts, three searches and five graph algorithms |
| Benchmark workers | Python multiprocessing | Isolated timed execution and output verification |
| Persistence | SQLite | Experiment profiles, results, trials and historical feedback |
| Presentation | Recharts and Cytoscape | Complexity and benchmark charts, graph exploration |

## Follow one request
1. The user selects Sorting, Searching, or a graph task. The task is supplied by the user; the system does not infer whether an arbitrary list should be sorted or searched.
2. Typing and uploading fill the same draft field. Analyze input parses that draft and sends the applied input to POST /api/{domain}/select.
3. The backend creates a profile, applies eligibility rules, computes scores, and returns the profile, candidates, reasons, exclusions, and recommendation.
4. The visualizer requests POST /api/{domain}/trace/{algorithm}. The same algorithm implementation emits bounded step snapshots.
5. Run benchmark sends a separate request. The server returns a job ID; the browser polls its progress while isolated workers execute candidates.
6. A completed benchmark is verified and saved. Similar experiments can influence a later selection request.

## Why the separation matters
An initial recommendation is fast because it performs analysis and scoring rather than timing every candidate. Playback is a teaching view of recorded operations. Benchmarking is a separate measurement workflow. A visible suitability score, an animation duration, and a measured runtime are three different quantities.

The frontend rewrites /api requests to the backend, normally at 127.0.0.1:8000. The interface normally runs at 127.0.0.1:3000. This local architecture needs no external AI service or API key.

<!-- PAGE -->
# 2 Input contracts and text behavior

## Integers and text
Choose Integers or Text / alphanumeric. Type directly, paste a list or column, or upload CSV, TXT, or a JSON array. Commas, semicolons, whitespace, tabs, and newlines separate values. A table is flattened in reading order; the application does not sort complete records by a selected column. Omit headings because every supplied cell is treated as data. [S1, S2]

In text mode, quote phrases such as "New York". JSON strings must be quoted: ["0012", "A2"]. Text mode preserves leading zeros and case. Integer mode treats numeric tokens as numbers. A request must use one type consistently across data and search targets. Decimals and mixed integer/string arrays are rejected.

| Input | Interpretation in text mode |
| A10 and A2 | A10 precedes A2 by character order, not natural numeric suffix order |
| Apple and apple | Distinct values with case-sensitive matching |
| 0012 and 12 | Distinct string identifiers |
| "New York" | One complete value containing a space |

Text uses Python Unicode lexicographic comparison: compare left to right; the first differing character decides; a shorter equal prefix comes first. There is no case folding, locale collation, or Unicode normalization. Maximum string length L matters because one comparison may examine O(L) characters.

## Validation and submission
The browser parses drafts and displays the interpreted values. The backend repeats authoritative validation with strict Pydantic types. Invalid data produces an explanation instead of a fabricated result. Integer values are bounded by absolute value 10^12; datasets allow 20,000 values and searches allow 2,000 targets. A text value allows 1–256 characters, with a combined 1,000,000-character bound on data and targets. UI file uploads are limited to 1 MB.

Analyze input or Ctrl+Enter applies the draft. Enter alone adds a newline in the data field; Enter in the search target field submits the form. Editing marks the input as pending so playback and benchmarking cannot silently use the draft as if it had been analyzed. Sorting ignores unused search target drafts.

Graphs accept node labels and edge triples source,target,weight. Labels can be words or IDs; weights remain bounded integers. Labels must be unique, edge endpoints must exist, the source must exist, and duplicate edge pairs are rejected. Directed and undirected modes are explicit.

<!-- PAGE -->
# 3 Profiling is itself an algorithm

The profiler measures the complete submitted data; preview truncation does not change those measurements. For the input [3, -1, 2, 2], it computes the following. [S3]

| Property | Calculation | Result |
| Size n | Length of the parsed array | 4 |
| Minimum and maximum | Linear scans | -1 and 3 |
| Integer range k | max - min + 1 | 5 |
| Unique values u | Set of values | 3 |
| Duplicate ratio r | (n - u) / n | 0.25 |
| Adjacent order | Count a[i] <= a[i+1], divide by n-1 | 2/3 |
| Reverse adjacent order | Count a[i] >= a[i+1], divide by n-1 | 2/3 |
| Inversions I | Count i < j with a[i] > a[j] | 3 |
| Disorder | I / (n(n-1)/2) | 0.5 |

An inversion need not involve adjacent elements. Here 3 exceeds each of the three later values. Equality is not an inversion. Adjacent and reverse order can both be high when duplicates are common; all-equal data scores 100% on both. Zero inversions means nondecreasing input.

## Divide and conquer counts inversions efficiently
Split the array, recursively count inversions in each half, and merge the two sorted halves. When right[j] is smaller than left[i], every remaining left value is also larger, so add len(left)-i in one step. For this example, [3,-1] becomes [-1,3] with one inversion. Merging it with [2,2] contributes two more inversions. Total: three.

The recurrence is T(n) = 2T(n/2) + O(n), giving O(n log n) comparisons and O(n) peak auxiliary space. Brute-force pair checking would take O(n²). The temporary sorted result is used for counting; the original submitted order remains intact.

Min/max and neighbor checks use O(n) comparisons. Set construction is expected O(n) for integer keys. Numeric histogram calculation uses 16 bins. For text, numeric range and histogram are not applicable; the profile adds average and maximum length. Text profiling has O(L n log n) worst-case comparison work.

The selector uses size, inversions, duplicates and numeric range directly. Reverse order, histogram and extrema are descriptive or supporting measurements, not independent score terms. Negative integers are supported by offsetting Counting and Radix keys.

<!-- PAGE -->
# 4 Recommendation mathematics with a worked result

Eligibility is checked before choosing a winner. For each eligible candidate a, the system calculates four components and a final score. Let W(a) be estimated work, and Wmin the minimum eligible work. [S4]

Complexity component C(a) = min(1, sqrt(Wmin / max(1, W(a))))

Score(a) = 100 × [0.40 C(a) + 0.30 F(a) + 0.15 M(a) + 0.15 H(a)]

F is data fit, M is a memory preference, and H is historical evidence. No matching evidence gives H = 0.5. Scores are rounded to two decimals and candidates are sorted in descending order. Excluded algorithms receive zero and cannot win. Equal rounded scores retain catalog order; there is no probabilistic tie breaker.

## Work through the example
Use [3, -1, 2, 2], balanced memory, no stability requirement, and neutral history. Here n=4, log2(n)=2, I=3, r=0.25 and k=5. These values were checked against the current selector.

| Algorithm | Estimated work W | Final score |
| Quick | 4 × 2 × (1 - 0.6 × 0.25) = 6.8 | 87.55 |
| Insertion | 4 + 3 = 7 | 80.67 |
| Merge | 4 × 2 = 8 | 78.43 |
| Counting | 4 + 5 = 9 | 76.68 |
| Heap | 2 × 4 × 2 = 16 | 67.18 |
| Radix | 1 × (4 + 256) = 260 | 34.97 |

For Quick, C=1, F=0.85+0.1×0.25=0.875, M=0.92 and H=0.5. Therefore score = 100×(0.4+0.2625+0.138+0.075)=87.55. The recommendation is Quick Sort. That is a suitability decision, not a measured claim that Quick will execute fastest on four elements.

## Defend the design honestly
The weights, fit constants, memory preferences and work multipliers are explicit design heuristics. They are not trained coefficients, calibrated probabilities, byte measurements, or a formal optimality proof. The formula makes decisions inspectable and testable. Historical timing can change a future ranking, but only contributes 15%.

A sorted input [1,2,3,4,5,6] with the same settings recommends Insertion at 92.5 because I=0. This demonstrates that the recommendation responds to the nature of the data. Existing history can alter the exact displayed scores.

<!-- PAGE -->
# 5 Eligibility and the exact sorting model

First enforce prerequisites and user constraints. Only then rank the remaining algorithms. Let n=max(1,size), g=max(1,log2(n)), I=inversions, r=duplicate ratio and k=integer range. [S4]

| Algorithm | Estimated work | Fit F | Memory M |
| Insertion | n + I | max(0.05, 1 - I/(n g)) | 1.00 |
| Merge | n g | 0.86 | 0.55 |
| Quick | n g (1 - 0.6r) | 0.85 + 0.1r | 0.92 |
| Heap | 2 n g | 0.62 | 1.00 |
| Counting | n + k | max(0.1, 1 - k/(16n)) | 0.45 |
| Radix | max(1, ceil(log2(max(1,k))/8)) × (n+256) | 0.80 if n>=512, else 0.45 | 0.50 |

## Hard rules in the current implementation
Text excludes the current Counting and Radix implementations. Require stable sort excludes Quick and Heap. Limited auxiliary memory excludes Merge, Counting and Radix. Counting additionally requires k<=200,000 and k<=max(256,32n); exceeding either limit excludes it.

The range guard prevents an input such as [1,1000000000] from allocating an enormous counting array. Negative values alone do not exclude counting: translating by the minimum produces valid nonnegative indices. The broader 32n guard is in selection, while Counting itself also checks the absolute 200,000-bucket cap.

Radix work uses at least one estimated pass even when all values are equal. The actual implementation performs translation and restoration but no digit passes when the translated maximum is zero. This illustrates why estimated work is not an exact operation count.

## When a method is favored
Few inversions favor Insertion. Stable, predictable comparison sorting can favor Merge. General input and duplicates strengthen Quick. Constant auxiliary memory makes Heap eligible and useful, although the chosen weights may still favor Quick. Compact integer ranges strengthen Counting. Larger integer datasets improve Radix fit, but Radix is not guaranteed to win merely because it is eligible.

If a student says “nearly sorted always chooses Insertion,” correct it to “few inversions improve Insertion’s estimated work and fit; the complete score and constraints determine the winner.” There is no dedicated natural-language classification stage such as “this looks random.”

<!-- PAGE -->
# 6 Searching and graph selection rules

For searching, q is the submitted query count and g=max(1,log2(n)). Ordered means zero inversions. Results are membership booleans in query order, not original positions. [S4, S5]

| Search | Estimated work | Fit F | Memory M |
| Linear | max(1, qn/2) | 1 if q<=2, else 0.35 | 1 |
| Binary | max(1, qg + sort cost) | 0.95 ordered, else 0.65 | 1 ordered, else 0.5 |
| Hash | n + q | 0.95 if q>g, else 0.4 | 0.4 |

Binary sort cost is zero for ordered data, otherwise ng. Unsorted Binary is excluded unless preprocessing is allowed. Limited memory excludes Hash and unsorted Binary. If expected updates is nonzero, fit is multiplied by 1 for Linear, 0.4 for Binary, and 0.7 for Hash. The current formula responds to zero versus nonzero updates; it does not scale continuously with the update count. Benchmarks do not simulate those updates.

Graph profiling measures V, E, directedness, density, whether any weight differs from 1, and the number of negative edges. Self-loops are excluded from the density numerator; possible non-loop edges are V(V-1) directed or V(V-1)/2 undirected. Profiling is O(V+E). [S3]

| Requested graph task | Eligible implementations |
| Traversal | BFS and DFS; weights do not matter for reachability |
| Single source with every weight 1 | BFS, Dijkstra and Bellman–Ford |
| Single source with other nonnegative weights | Dijkstra and Bellman–Ford |
| Single source with a negative edge | Bellman–Ford |
| All pairs | Floyd–Warshall |

Graph work estimates are V+E for BFS/DFS, (V+E)g for Dijkstra, V×max(1,E) for Bellman–Ford, and V³ for Floyd. Fit constants are 0.95 BFS, 0.90 DFS, 0.95 Dijkstra, 0.98 Bellman with negatives or 0.55 without, and 0.95 Floyd. Memory is 0.8 except Floyd at 0.4.

Density helps explain the graph and match history, but is not a separate weighted score term. The array memory policy is not a hard graph-memory filter. All-pairs currently has one candidate, so that decision is task dispatch rather than a competitive all-pairs comparison.

<!-- PAGE -->
# 7 Insertion Sort and Merge Sort

## Insertion Sort
Purpose: sort efficiently when little rearrangement is required. Imagine arranging playing cards: keep a sorted prefix, take the next value, shift larger prefix values right, and insert the held value into its place. [S5]

Example: [3,1,2] becomes [1,3,2] after inserting 1, then [1,2,3] after inserting 2. Each shift removes one inversion, which explains the adaptive O(n+I) bound.

Correctness: before each iteration the prefix is sorted. Shifting only larger values creates the correct position for the held value and preserves the order of the remaining prefix. After the last insertion, the prefix is the whole array.

Cost: best O(n) on ordered data, average/worst O(n²); O(1) core auxiliary space. It is stable because equal values are not shifted past one another. This implementation returns a copied list, so total call storage includes that O(n) copy.

Selection: low inversion count gives both a smaller work estimate and a larger fit score. It survives both stable-sort and limited-memory constraints. In benchmark jobs, more than two million inversions causes a safety skip for Insertion rather than a lengthy quadratic run.

## Merge Sort
Purpose: predictable stable sorting for integers or text. Divide the array in halves until runs have length one. Merge sorted runs by repeatedly taking the smaller head. Ties are taken from the left, preserving stability. [S5]

Example: [4,1,3,2] divides into [4,1] and [3,2], becomes [1,4] and [2,3], and merges to [1,2,3,4].

Correctness: assume recursive calls correctly sort the halves. At each merge step the smaller head is the smallest remaining value overall; append it. Repeating gives a sorted permutation of both halves. This is an induction on input size.

Cost: O(n log n) comparisons in best, average and worst cases, with O(n) auxiliary storage at peak. Recurrence: T(n)=2T(n/2)+O(n). Python slicing creates temporary lists; the implementation is not an in-place merge.

Selection: Merge remains eligible when stability is required and memory is balanced. Limited auxiliary memory excludes it. Binary Search uses this same Merge implementation when preprocessing is allowed on unsorted input.

<!-- PAGE -->
# 8 Quick Sort and Heap Sort

## Quick Sort
Purpose: efficient general comparison sorting, with special handling for repeated values. The implementation chooses the median of the first, middle and last values as pivot. It partitions into values below, equal to, and above that pivot. Only the outer regions need further sorting. [S5]

Example: partition [3,2,4,1,3] around pivot 3. Values 2 and 1 go left, both 3s stay in the equal region, and 4 goes right. Sorting the outer regions completes the result.

Correctness: partition boundaries maintain the below/equal/above relationships. Once the outer regions are sorted, concatenating them with the equal region gives a sorted permutation. Equal keys need no further partition work.

Cost: average O(n log n), worst O(n²). The median-of-three strategy reduces some poor pivots but cannot remove the quadratic worst case. This three-way variant is O(n) on all-equal input; balanced distinct partitions take O(n log n). An explicit stack processes the smaller region next to keep stack use O(log n). The algorithm is unstable and the returned input copy costs O(n) storage.

Selection: receives strong general fit and a duplicate adjustment. It is excluded when stability is mandatory and remains eligible under limited auxiliary memory.

## Heap Sort
Purpose: comparison sorting with an O(n log n) worst-case guarantee and constant core auxiliary space. Build a max heap: each parent is at least as large as its children. Swap the root maximum with the last unsorted slot, shrink the heap, and sift the replacement down. [S5]

Example: a heap over [3,1,2] puts 3 at the root. Move 3 to the final slot, restore the heap over [2,1], then move 2. Result: [1,2,3].

Correctness: the root is the maximum remaining value, so placing it at the end is correct. The sorted suffix grows while the remaining prefix stays a heap. Repeating exhausts the prefix.

Cost: bottom-up heap construction O(n); up to n removals at O(log n), giving O(n log n) average/worst. This implementation stops sifting early, so all-equal values can take O(n); do not confuse that implementation-specific best case with its general bound. Core space O(1), plus the O(n) returned copy; unstable.

Selection: useful under limited memory but excluded by stability. Eligibility does not guarantee recommendation: its work multiplier and fit score can place it below Quick.

<!-- PAGE -->
# 9 Counting Sort and Radix Sort

## Counting Sort
Purpose: exploit a small integer key range instead of comparing every pair of values. Compute lo and hi, allocate k=hi-lo+1 counters, count each key at index value-lo, form prefix counts, and place values into an output array. Traverse input backward during placement to preserve equal-key order. [S5]

Example: [-1,2,-1,0] has range four. Counts for -1,0,1,2 are [2,1,0,1]. Prefix counts identify output positions; the result is [-1,-1,0,2]. Offsetting supports negative integers without changing their ordering.

Correctness: counts preserve multiplicities; prefix sums allocate a nonoverlapping ordered block for every value. Backward placement preserves stability within each equal-key block.

Cost: O(n+k) time and O(n+k) auxiliary space, including the output array. It is stable and non-comparison based. It is not efficient if n is small but the range is huge.

Selection: requires integer keys, balanced memory, k<=200,000 and k<=max(256,32n). Compact ranges improve its estimated work and fit. Text is excluded by this implementation even though other counting-based encodings could theoretically be designed.

## Radix Sort
Purpose: sort integers by processing digits rather than allocating a counter for every whole value. Translate keys by the minimum, then perform stable counting passes on successive base-256 digits from least significant to most significant. Finally restore the offset. [S5]

For intuition, decimal LSD sorting of [21,13,12] first orders the units digits to [21,12,13], then the tens digits to [12,13,21]. The application uses bytes, not decimal digits. Stability of each pass preserves ordering already established by less significant digits.

Correctness: after pass j, values are ordered by their lowest j digits. A stable next pass groups the new digit while preserving those lower-digit orders. After all digits, the complete keys are sorted. Translation is order preserving.

Cost: O(n+d(n+256)) time and O(n+256) auxiliary space, where d is the actual number of byte passes. All-equal translated keys need no digit pass, but still require O(n) translation/restoration. Stable and integer-only here.

Selection: balanced memory is required. Larger n improves its fit, while base-256 setup can make small datasets unattractive. Neither Radix nor Counting violates the comparison-sort lower bound: they use key structure outside that model. [T1]

<!-- PAGE -->
# 10 The three searching algorithms

## Linear Search
Working: scan values from left to right for each target; stop on equality or after the final value. For [9,1,7,4] and target 7, compare 9, then 1, then 7. An absent target requires the full scan. Correctness follows because every possible position is checked unless a match has already been found. [S5]

Purpose and selection: useful for unsorted input, few queries, or limited memory. There is no index construction. Core cost is O(n) worst-case per query and O(qn) for q queries, with O(1) core space plus O(q) answers. Best core query cost is O(1). The selector's qn/2 estimate is a heuristic and can underestimate absent-query scans.

## Binary Search
Working: on sorted data, inspect the midpoint. If the target is smaller, discard the right half; if larger, discard the left half; if equal, succeed. For [1,4,7,9] and target 7, midpoint value 4 eliminates the left part, then 7 is found. [S5]

Correctness: the invariant is that any existing match remains inside [low,high]. Sorted order justifies discarding a half. Each step roughly halves the interval, giving O(log n) worst-case per query and O(q log n) for the query core. An immediate midpoint match takes O(1) per query.

Purpose and selection: suitable when input is already ordered, especially with multiple queries. Unsorted input requires explicit Merge preprocessing permission; that adds O(n log n) time and O(n) memory. The result is membership rather than an index, because sorting changes positions.

## Hash Lookup
Working: build 2n+1 buckets and append values into their hash bucket. Look up each target in its bucket, checking full equality for collisions. Integer bucket index is value mod bucket count. Text uses h=(31h+Unicode code point) mod bucket count for every character. Different values sharing a bucket are not treated as equal. [S5]

Purpose and selection: many queries can amortize index building. Expected integer-key time is O(n+q), worst O(n+qn) with long chains, and storage O(n) plus answers. Text hashing processes characters and equality can cost O(L). Limited memory excludes the index. It is rebuilt inside every benchmark execution.

Implementation detail: the shared execute wrapper checks array ordering with an O(n) worst-case scan and a temporary O(n) slice for every search algorithm. Consequently measured sorted-input Binary is O(n+q log n) including that check, not purely O(q log n). The catalog describes query-core bounds; this overhead is not fully represented in the selection estimates.

<!-- PAGE -->
# 11 Graph representation BFS and DFS

## Understand the task first
A vertex is an entity and an edge connects two entities. An edge weight is a numeric cost; it is not a node label. Traversal asks which vertices can be reached from the chosen source. Single-source shortest paths ask the cheapest distance from that source to every reachable vertex. All-pairs asks the same for every source. [S5]

The engine constructs an adjacency list: each vertex maps to its outgoing (neighbor,weight) entries. For undirected edges it inserts both directions, except self-loops. Adjacency construction is part of execution and costs O(V+E). Unreachable distances are infinity internally and null in JSON.

## Breadth first search
Working: put the source in a FIFO queue and mark it discovered. Remove the front, discover its unseen neighbors, assign parent and distance+1, and append them to the queue. Vertices are explored by layers. [S5]

Example: A connects to B and C, and B connects to D. Starting at A, BFS visits A, then B and C, then D. Distances are A=0, B=1, C=1 and D=2. Within a layer, input adjacency order can affect visit order.

Correctness: the queue processes all vertices at distance d before any at d+1. The first discovery therefore gives the minimum number of edges from the source. Time O(V+E); working traversal state O(V), with O(V+E) total auxiliary storage including adjacency.

Selection: eligible for traversal or single-source shortest paths when every weight is exactly 1. In traversal mode weights are ignored. BFS does not minimize arbitrary weighted path costs. Equal positive weights could be handled by scaling in a different design, but the current shortest-path gate specifically requires 1.

## Depth first search
Working: follow an unvisited neighbor as deeply as possible, then backtrack when that vertex has no unvisited neighbors. The implementation uses a stack of (vertex,neighbor iterator) frames to preserve genuine depth-first discovery. It avoids Python recursion. [S5]

Correctness: each discovered vertex is marked once; exploring all of its outgoing neighbors eventually discovers every reachable vertex. Time O(V+E), with O(V+E) storage including adjacency. Traversal begins at the chosen source; disconnected components are not automatically traversed.

Selection: eligible only for traversal. Its returned parent tree and depth describe the discovery path, not a shortest-path guarantee. The current traversal scores generally favor BFS, but the visualizer lets the user choose eligible DFS to compare behavior.

<!-- PAGE -->
# 12 Dijkstra and Bellman Ford

Both algorithms use relaxation: if dist[u]+weight(u,v)<dist[v], update dist[v] and remember u as its parent. The difference is the order and repetition of those updates. [S5]

## Dijkstra
Working: set the source distance to zero and other distances to infinity. Use a min heap to repeatedly take the smallest tentative distance, then relax outgoing edges. The implementation pushes improved entries and skips stale heap entries when popped; it does not implement decrease-key. [S5]

Example: A→B costs 4, A→C costs 1, C→B costs 1. After A, tentative distances are B=4 and C=1. Process C next and improve B to 2. The cheapest A-to-B path is A→C→B, not the direct edge.

Correctness: with nonnegative edges, a smallest tentative distance cannot later be reduced through a still-more-distant unsettled vertex. That greedy argument fails with negative weights. A negative edge is therefore excluded before execution; the implementation also checks it directly.

Cost: conventional simple-graph bound O((V+E) log V), with O(V+E) space including adjacency and the lazy heap. More precisely, lazy heap operations can be expressed using log(E+1); with duplicate edges disallowed, E is bounded by O(V²), giving the usual log V form for nontrivial graphs.

Selection: eligible for single-source requests with nonnegative weights, including zero. It competes with Bellman–Ford and, for unit weights, BFS. [T2]

## Bellman Ford
Working: relax all adjacency edges for at most V-1 rounds. Stop early if a round makes no update. Then scan once more: an improvement indicates a negative cycle reachable from the source. [S5]

Why V-1: without a relevant negative cycle, a shortest path can be chosen simple, containing at most V-1 edges. Each full relaxation round propagates sufficient information to cover another edge; in-place updates may propagate farther in one round. The extra check tests whether finite shortest paths remain well-defined. [T2]

Example: change C→B above to -2. A→C→B costs -1, so Bellman–Ford is eligible while Dijkstra is excluded. A negative edge alone is valid. A reachable negative cycle permits endlessly decreasing walk cost for affected vertices, so the application returns a cycle flag instead of finite distances.

Cost: commonly O(VE); the code also loops over all vertices each round, giving the safe O(V(V+E)) bound when including sparse/isolated-vertex overhead. Early convergence can approach O(V+E). Space O(V+E). Selection: single-source, especially when any negative edge exists.

<!-- PAGE -->
# 13 Floyd Warshall and graph decision examples

## Floyd Warshall
Purpose: compute shortest-path distances between every pair of vertices. Build a distance matrix: zero on the diagonal, edge weights where edges exist, and infinity elsewhere. Then allow each vertex k in turn as an intermediate point. [S5]

For every pair u,v, apply dist[u][v] = min(dist[u][v], dist[u][k] + dist[k][v]). The order of loops is k, then u, then v. Three nested vertex loops give O(V³) time and O(V²) matrix space.

Correctness: after processing k, matrix entries describe the best paths whose intermediate vertices come from the processed set. A best path either avoids k or splits into u-to-k and k-to-v. This is dynamic programming over permitted intermediate vertices.

With edges A→B=4, A→C=1 and C→B=1, allowing C improves A-to-B from 4 to 2. Unlike Dijkstra, Floyd computes answers for every source in the same matrix. It accepts negative edges; a negative diagonal after processing indicates a negative cycle. The application returns a cycle flag instead of an all-pairs distance matrix in that case.

## Explain these choices in a demonstration

| Input or request | What the selector does | Reason |
| Traversal on a weighted graph | Retains BFS and DFS | Reachability ignores edge cost |
| Single source with all weights 1 | Retains BFS, Dijkstra, Bellman | BFS gives shortest hop distances |
| Single source with positive varied weights | Excludes BFS and DFS | Weighted cost needs a weighted method |
| Single source with any negative edge | Retains Bellman only | Dijkstra prerequisite fails |
| All pairs on a small graph | Retains Floyd only | It is the implemented all-pairs method |

Current all-pairs selection does not compare Floyd against repeated Dijkstra or Johnson. Those are possible extensions, not existing candidates. A denser graph can change work estimates and history matching, but density alone does not trigger a switch to a second all-pairs algorithm.

For undirected graphs, a negative edge is represented in both directions. Traversing it forward and backward yields a negative closed walk, so finite shortest-path costs can fail for its reachable component. Bellman checks cycles reachable from the selected source; Floyd examines the whole matrix. An unreachable negative cycle need not invalidate an unrelated single-source answer.

<!-- PAGE -->
# 14 Real execution visualization and benchmarking

## Playback records actual implementation steps
Algorithms receive a Metrics object with an optional observer. In trace mode, comparisons, moves, visits, relaxations and other meaningful events emit state snapshots. The recorder deep-copies state, independently checks the final result, and returns frames. The frontend changes the displayed frame for Play, Pause, Next, Previous, Restart or timeline navigation. [S5, S6]

It does not animate a different JavaScript algorithm. Numeric values use bars, text uses labeled cards, and graphs show traversal, edges and distances. Frames are meaningful teaching events, not necessarily one CPU instruction or every source-code statement. Playback speed is selected by the user and is unrelated to measured execution speed.

## Benchmark sequence
1. Recompute selection for the submitted request and freeze it for this experiment.
2. For each eligible candidate, create an isolated Python worker. Candidates run sequentially within one job.
3. Perform one warmup execution and discard its timing.
4. Run 1–5 trials, default 3, on identical fresh input copies. Time execute using perf_counter_ns and report the median in milliseconds.
5. Check complete output with an independent reference. Then run a separate tracemalloc pass to measure peak Python allocation.
6. Return runtime samples, correctness, operation counters and a bounded output preview. Save a completed experiment for history. [S6]

Initial profiling, selection, process startup, transport copies and correctness checking are outside the reported algorithm timer. Internal algorithm copies, adjacency/index construction, search ordering checks and permitted sort preprocessing are inside it. Worker startup still contributes to the user’s total waiting time and to the worker timeout budget.

Sorting is checked against Python sorted; searching against membership; graph distances against a separate synchronous relaxation reference. Traversal verification checks reachable membership, uniqueness and source position; it does not prove the exact BFS/DFS visit ordering. Tests provide additional coverage. Built-in sorted is the oracle, not the timed sorting implementation.

Operations = comparisons + moves + visits. A swap counts as two moves; recursion calls and swaps are also reported separately. Counters are implementation-specific events, not CPU instructions or character-level string work. tracemalloc measures Python allocation, not total process RAM or RSS.

Median reduces sensitivity to a single timing spike; three trials do not establish statistical significance. Instrumentation, Python runtime, background load and very short durations can affect winners. No guaranteed speedup or confidence interval should be claimed.

<!-- PAGE -->
# 15 History adaptation and evaluation

SQLite contains four related tables: experiments, dataset_profiles, algorithm_results and benchmark_runs. They store the frozen selection, profile, selected algorithm, measured winner, result metadata and individual trial times. Completed evidence persists after restarting the backend; live jobs do not. Profiles contain a bounded input sample rather than the complete dataset. [S7]

## Which experiments count as similar
The history query returns up to 500 recent experiments; evidence examines the latest 100 for the domain and accepts at most 20 matching usable experiments. Sizes must be within a factor of two. Numeric and text histories are separated.

Array matching requires disorder difference <=0.12 and duplicate-ratio difference <=0.20. The logarithmic normalized range comparison allows a difference of at most 2 in log2(max(1,k/n)); for text, range is absent and average-length matching is used, with the analogous log2 difference <=2. Search additionally matches query count, expected updates and preprocessing permission exactly.

Graph matching requires the same task, directedness and weighted flag, the same presence/absence of negative edges, and density difference <=0.20. These are heuristic similarity criteria, not a proof that runtimes will transfer between inputs.

## How evidence changes the score
For algorithm a in a matching experiment j, let r(j,a)=fastest successful runtime / runtime(a). Its historical component is:

H(a) = (1 + sum of r(j,a)) / (2 + number of matching observations for a)

The extra 1 and 2 represent two neutral observations averaging 0.5. With no history H=0.5. If one observation has relative speed 0.8, H=(1+0.8)/3=0.6. This limits overreaction to one run. The formula and main score weights remain fixed; no model training occurs.

## Evaluation quantities mean different things
Correctness asks whether the algorithm output solves the requested problem. Selection accuracy is the fraction of evaluated experiments where the recommendation equals the fastest successful candidate. Performance gap is (selected time / fastest time - 1) × 100. With 2 ms selected and 1.6 ms fastest, the gap is 25%.

Baseline speedup aggregates sum(baseline time) / sum(selected time) across records where both are available. Baselines are Quick for sorting, Linear for searching, and Bellman for graphs. They are benchmarked only when eligible; absent baselines are omitted, not forced into incompatible tasks. A speedup above 1 indicates lower selected runtime on that measured comparison, not universal superiority.

<!-- PAGE -->
# 16 API contracts and frontend state

The frontend is a client interface over a JSON API. These are the main routes currently implemented. [S1, S2, S6, S8]

| Method and route | Purpose |
| GET /api/health | Check backend availability |
| GET /api/metadata | Algorithm catalog and score weights |
| POST /api/{domain}/analyze | Return a profile only |
| POST /api/{domain}/select | Profile, filter, rank and explain |
| POST /api/{domain}/trace/{algorithm} | Record verified execution frames |
| POST /api/{domain}/benchmark | Start job; return job_id with HTTP 202 |
| GET /api/jobs/{job_id} | Poll queued/running/completed/error status |
| POST /api/jobs/{job_id}/cancel | Request cancellation |
| POST /api/complexity/empirical | Measure one sort on input prefixes |
| GET /api/history and /api/history/{id} | List saved evidence or inspect a run |

## Example request and response meaning
For POST /api/searching/select, send data [9,1,7,4], queries [7,99], allow_preprocessing false, memory balanced. Other fields have validated defaults. The response includes a profile with n=4 and query count 2; Binary is excluded because the input is unsorted. With neutral history, Linear is recommended at 92.5. A trace returns [true,false] as the answers.

Domain is sorting, searching or graph. Shared request fields include data, queries, stable, memory, allow_preprocessing, updates, nodes, edges, directed, task, source and trials. A selection response contains candidates with eligible, reasons, exclusions, estimated_work, components, score and metadata.

## Avoid stale results
The workspace context holds applied input, input drafts, selected domain, recommendation, job status and history. Changes to the draft mark it pending. Applied changes clear stale results and request new analysis. A revision counter prevents an older request from replacing the result of a newer request. Running benchmarks lock input changes.

Benchmark polling normally repeats about every 400 ms. Empirical polling uses about 500 ms. Missing job IDs after a server restart produce a clear message and unlock the interface. A cancellation request is observed by the coordinator/worker; partial cancelled benchmark runs are not saved as complete history.

Jobs use a background thread coordinator and separate multiprocessing workers. An in-memory job dictionary is protected by a reentrant lock. At most two active jobs are accepted; completed job entries are bounded. Multiple Uvicorn workers are unsuitable without moving job state to shared storage.

<!-- PAGE -->
# 17 Complexity experiments validation and limits

## What Complexity lab measures
The reference chart plots theoretical functions such as 1, log2(n), n, n log2(n) and n² with illustrative coefficients. The measured chart runs a selected sorting implementation on increasing prefixes of the actual applied dataset, up to its first 4,000 values. No synthetic dataset is generated. [S6, S8]

The UI derives up to five sizes near 20%, 40%, 60%, 80% and 100% of that cap, removes duplicates and enforces valid sizes. Each prefix preserves original order. The backend accepts 2–6 increasing unique sizes from 2 to 4,000, bounded by input length. Text works with the four comparison sorts; integer-only methods are rejected for text.

A finite curve can illustrate growth and implementation effects, but cannot prove an asymptotic bound. Prefixes may change the distribution as well as size. For text, string lengths and shared prefixes affect time. Empirical runs are separate from adaptive history.

| Limit | Current behavior |
| Data and targets | 20,000 values and 2,000 queries |
| Graph size | 80 nodes and 2,000 edges; unique pairs |
| Graph weights and labels | Integer weights within ±1,000,000; labels 1–32 characters |
| Visual playback | 80 values, 8 queries, or 16 nodes and 60 edges |
| Trace length | At most 4,000 recorded frames; omitted steps disclosed |
| Benchmark output preview | First 120 list results; full output verified first |
| Worker timeout | 8 seconds for the isolated-worker lifecycle |
| Insertion safety skip | More than 2,000,000 inversions in benchmark jobs |

## Validation evidence and its meaning
The latest completed verification recorded 161 passing backend tests and 13 browser scenarios across regression runs, plus frontend lint, type checking and a production build. Coverage includes algorithms, validation, selection, traces, isolated workers, history, numeric and text input, hash collisions, graph behavior, mobile layout and lost-job recovery. [S9]

These are functional checks, not a measured accuracy claim over a representative independent benchmark corpus. No percentage speedup or universal selection accuracy is asserted here. A stronger evaluation would use repeated controlled runs, held-out datasets, multiple baselines, timing uncertainty and end-to-end overhead measurements.

Development is local without authentication, a durable job queue or a multi-user deployment design. Treat public deployment, machine-specific history, richer record data and broader algorithm families as future work.

<!-- PAGE -->
# 18 A demonstration you can explain

## Start the two services
In one VS Code PowerShell terminal at D:\college\Sem_5\DAA\P2:

CODE .\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000

In a second terminal:

CODE cd D:\college\Sem_5\DAA\P2\frontend
CODE npm.cmd run dev

Open http://127.0.0.1:3000. The backend root can return 404 because the UI is on 3000; use /docs or /api/health on 8000. EADDRINUSE means another server owns that port: reuse it or stop its terminal, rather than launching duplicates. If intentionally changing the backend port, set frontend BACKEND_URL to its matching address and restart the frontend.

## Show one clear example for each task
Sorting: select Integers, enter 1,2,3,4,5,6 and Analyze. Explain zero inversions and Insertion’s O(n+I) estimate. With neutral history it scores 92.5. Switch to 3,-1,2,2 and explain why the computed profile and ranking change. Show Play/Next, then run a benchmark and distinguish recommendation from measured winner.

Text: select Text / alphanumeric and enter banana,A2,A10,apple,0012,"New York". The sorted output is ["0012","A10","A2","New York","apple","banana"]. Explain lexicographic order and why Counting/Radix are excluded. The same parser accepts a file upload.

Searching: enter 9,1,7,4 and targets 7,99. Explain Linear’s no-setup advantage and Binary’s exclusion. Enable sort preprocessing, select Binary for playback, and show the true/false answers. More queries can make building an index worthwhile; Hash includes its build time.

Graph: use directed edges A,B,4; A,C,1; C,B,1, entered on separate lines. Choose source A and single-source shortest paths. The answer B=2 via C explains relaxation. Change C,B,1 to C,B,-2: Dijkstra becomes ineligible and Bellman handles B=-1. Change task to all-pairs to show Floyd’s matrix; change to traversal to compare BFS/DFS.

## Close with evidence rather than promises
Say: “We measured the input, explained eligibility and ranking, executed the same implementation visually, and verified real benchmark outputs. Our score is a transparent heuristic, and the measured winner can differ. History provides bounded feedback for later similar inputs.” Scores can vary with saved history; verified output should remain the same.

<!-- PAGE -->
# 19 Viva questions on the project goal

## 1 What problem does your project solve
It helps choose among implemented algorithms for a known task using measured data properties and constraints, explains the choice, and evaluates it against actual execution. The task itself is supplied by the user.

## 2 What is your contribution if the algorithms already exist
Our contribution is the integration of profiling, prerequisite filtering, transparent scoring, execution visualization, controlled benchmarking and bounded historical feedback. We do not claim invention of Quick Sort or Dijkstra.

## 3 Is this artificial intelligence or machine learning
It is a rule-based adaptive recommendation system. Fixed formulas use input measurements and historical relative runtimes. There is no training dataset, learned model, neural network or probability estimate in the current implementation.

## 4 Why not always use Quick Sort
Its worst case is quadratic and it is unstable. Few inversions can favor Insertion, a compact integer range can favor Counting, and stability can exclude Quick altogether. One algorithm does not satisfy every task and constraint equally well.

## 5 Does the highest score guarantee the fastest algorithm
No. It is the highest estimated suitability under our formula. Runtime also depends on constants, interpreter overhead, cache effects and measurement noise. The separate benchmark tests the recommendation.

## 6 Why those four weights
They express our design priorities: work estimate 40%, fit 30%, memory 15%, history 15%. They are explicit heuristic choices, not experimentally proven optimal weights. Sensitivity analysis and held-out evaluation would be needed to justify stronger calibration claims.

## 7 Why use the square root in complexity normalization
It gives lower estimated work a higher component while compressing extreme ratios. For example a fourfold work penalty yields a 0.5 component rather than 0.25. This is a chosen scoring transformation, not a theorem about runtime.

## 8 What is the difference between eligible recommended and winner
Eligible satisfies the task prerequisites and configured constraints. Recommended has the highest heuristic score among eligible candidates. Winner is the fastest successfully verified candidate in that completed measured run. An eligible algorithm may still be skipped or time out during benchmarking.

<!-- PAGE -->
# 20 Viva questions on data and analysis

## 9 How does it know the data is sorted
It compares neighboring values and also counts exact inversions. Zero inversions means no earlier value exceeds a later one. The selector uses that property for Binary Search eligibility; it does not trust a user-supplied sorted label.

## 10 Why count inversions rather than just adjacent order
Neighbor checks describe local order but can miss large displacement. Inversions count all out-of-order pairs and directly relate to Insertion Sort’s shifts. For [2,3,4,1], only one neighbor pair descends, but 1 creates three inversions.

## 11 Are you already sorting during analysis
The inversion counter internally merges sorted copies to compute I, so yes, it performs sorting-like O(n log n) work. It keeps the original input unchanged. This is an educational profiling tradeoff, and we must not claim that the selection overhead is free.

## 12 Can analysis cost more than the selected algorithm
Yes, especially for small or already ordered inputs. End-to-end cost is profiling plus selection plus execution. Current reported benchmark times exclude the first two terms. Sampling or cheaper approximate disorder estimates could reduce overhead in future.

## 13 Why do results appear immediately
Small inputs require relatively little computation, and initial selection does not benchmark all candidates. There is no artificial delay. Larger datasets and longer strings take more work. The slow animation is deliberately paced for understanding.

## 14 What changes for strings and alphanumeric values
Comparison sorts and searches operate on homogeneous strings. Order is case-sensitive Unicode lexicographic order; 0012 stays text and A10 comes before A2. Comparison and hashing may process multiple characters, so length and common prefixes affect runtime.

## 15 Does the application support all data types
No. Current array input supports homogeneous integers or nonblank strings. Decimal values, mixed typed arrays, custom object records and natural-language semantic ordering are outside the current contract. Graph labels are text but weights are integers.

## 16 Is reverse order or a negative value a separate selection branch
Reverse adjacent order is reported, while inversions already penalize disorder. A negative integer does not itself exclude Counting or Radix because their keys are offset by the minimum. Graph negative weights are different: they affect shortest-path correctness and exclude Dijkstra.

<!-- PAGE -->
# 21 Viva questions on sorting and searching

## 17 What do stable and in place mean here
Stable preserves the relative order of equal keys. In-place refers to the algorithm core’s auxiliary storage. Our sorting functions copy the input for a returned result, so an O(1)-auxiliary core does not mean the entire call allocates only O(1) memory.

## 18 How do you justify Insertion O of n plus I
It performs a pass through n values, and each rightward shift corresponds to one inversion removed. Ordered input has I=0; reverse distinct input has I=n(n-1)/2. This links a measured property directly to estimated algorithm work.

## 19 Why does Merge take n log n
There are about log2(n) division levels, and each level merges O(n) values. Equivalently solve T(n)=2T(n/2)+O(n). The left-first tie rule preserves stability and the merge invariant proves correct ordering.

## 20 Does median of three remove Quick worst cases
No. It improves pivot choice for some patterns, but adversarial partitions can still be unbalanced and quadratic. Three-way partitioning handles repeated pivot values efficiently. The bounded explicit stack limits stack memory, not worst-case running time.

## 21 Why can Counting beat n log n
The comparison lower bound applies to algorithms that learn order only through comparisons of arbitrary keys. Counting uses bounded integer values as indices and costs O(n+k). When k is large, it can be much worse; it does not contradict the comparison model. [T1]

## 22 Why must a Radix pass be stable
After sorting one digit, later digit passes must preserve the order established for lower digits inside equal current-digit groups. An unstable pass can destroy that information and leave the full keys incorrectly ordered.

## 23 Why not sort once and always use Binary Search
Preprocessing costs O(n log n) time and memory, which may not pay off for a small query batch. Linear avoids index/sort construction, while Hash may suit many membership queries. The current system explicitly charges permitted Binary preprocessing inside its timing.

## 24 Is Hash Lookup always O of one
Only a lookup’s expected behavior under suitable distribution is approximately constant for bounded integer keys. Our run first builds the index in O(n), collision chains can require O(n) per query, and strings need character processing. Exact equality prevents false matches from collisions.

<!-- PAGE -->
# 22 Viva questions on graphs and correctness

## 25 Why can BFS find shortest paths but DFS cannot
BFS explores increasing hop-count layers, so first discovery gives the fewest edges. DFS explores depth before alternatives and may first reach a vertex by a longer route. BFS’s shortest-path statement requires unit edge costs in this application.

## 26 Why is Dijkstra unsafe for negative weights
Its greedy settling argument assumes later edges cannot reduce a route through a more distant unsettled vertex. A negative edge can invalidate that argument. Our selector and implementation enforce nonnegative weights rather than hoping a particular negative-edge input happens to work.

## 27 Why V minus one rounds in Bellman Ford
A shortest simple path uses at most V-1 edges. Full relaxation rounds propagate shortest-path information over those edges. If a further improvement remains after sufficient rounds, a reachable negative cycle exists. In-place updates can converge sooner, and our code stops when a round changes nothing.

## 28 Does a negative edge mean a negative cycle
No in a directed graph: an edge alone need not create a cycle. A cycle is negative when the sum of its weights is negative. In an undirected graph, representing a negative edge in both directions permits a negative closed walk by going forward and back.

## 29 Does a negative cycle invalidate every distance everywhere
No. It affects routes that can reach the cycle and continue to the destination. Bellman detects cycles reachable from the selected source; Floyd can detect one anywhere. Our response reports a cycle flag and does not enumerate all affected source-destination pairs.

## 30 Why is Floyd dynamic programming
Its state is the best distance for a pair using a permitted set of intermediate vertices. Adding vertex k gives two cases: avoid k, or combine paths through k. Reusing prior subproblem results gives the triple-loop recurrence and O(V³) time.

## 31 What happens to disconnected vertices and ties
Unreachable shortest-path distances are null in the API and shown as infinity in relevant views. Traversal starts from the selected source. Equal-cost alternatives need not produce identical parent trees; valid distances matter. Input neighbor order and heap label ties can affect which valid route is retained.

## 32 How do you prove the implementations are correct
Use invariants or induction for the algorithm argument, then tests and independent output checking for implementation evidence. Sorting is checked against sorted, search against membership, and graph distances against a separate relaxation oracle. Passing tests supports correctness but is not a mathematical proof for every possible input.

<!-- PAGE -->
# 23 Viva questions on measurement and adaptation

## 33 Why do the measured winner and recommendation differ
The selector uses approximate work and fixed fit/memory/history preferences, while the benchmark measures instrumented Python code on the current machine. Small constants, preprocessing, string costs, noise and different priorities can change the winner. That disagreement is an evaluation result, not necessarily an implementation error.

## 34 What exactly is included in runtime and memory
Runtime includes execute, internal copies, adjacency/index building, allowed sorting preprocessing and the search ordering check. It excludes initial profiling/ranking, worker startup, transport copies and verification. Memory is a separate tracemalloc peak of Python allocations, not total process RAM. [S6]

## 35 Why use warmup median and isolated workers
Warmup reduces first-run effects; median reduces the influence of an outlying trial; isolation supports timeout and cancellation without blocking the API. These controls improve consistency but do not make short timings noise-free or statistically conclusive.

## 36 What does historical adaptation actually learn
It aggregates relative runtime evidence from bounded similar experiments into a component of the next score. It does not learn new rules, weights or algorithms. A benchmark freezes its selection before execution; saved results influence future selection requests rather than rewriting that run’s original prediction.

## 37 Is selection accuracy the same as output correctness
No. Every successful candidate should return a correct output. Selection accuracy measures how often the recommendation matched that run’s fastest successful candidate. A correct algorithm can lose the timing comparison, and tiny timing differences can alter exact-match accuracy.

## 38 What are the strongest current limitations
Exact profiling overhead, heuristic weights, a small fixed candidate set, value-level string estimates, limited trials, machine-dependent history and bounded inputs. Expected updates are a fit adjustment, not a simulated workload. Graph memory constraints are not enforced like array constraints. All-pairs currently has only Floyd.

## 39 How would you evaluate or improve the project next
Measure total decision-plus-execution time against fixed baselines on held-out datasets. Repeat under controlled conditions, report uncertainty and performance gaps, vary score weights, and compare with simple baselines such as always choosing Quick. Then consider approximate profiling, richer history and more algorithm choices.

## 40 How should you handle an unfamiliar viva question
State the input assumptions and requested output first. Identify the invariant or recurrence that applies, reason through a small example, and connect it to the code path. Separate what is implemented from a possible extension. If evidence is missing, describe the test or measurement needed instead of inventing a result.

<!-- PAGE -->
# 24 Final revision sheet

## Four sentences to remember
The user supplies a task and data. We measure properties, exclude invalid choices and rank eligible implementations. We explain and visualize execution, then verify separate real benchmarks. Historical evidence can improve later recommendations, but selection remains heuristic and has overhead.

| Algorithm | Main idea | Main condition or strength |
| Insertion | Insert into sorted prefix | Few inversions; stable |
| Merge | Split and merge sorted runs | Stable predictable comparison work |
| Quick | Three-way pivot partition | General sorting and duplicates; unstable |
| Heap | Repeatedly remove maximum | Worst-case n log n, constant core space |
| Counting | Count whole integer keys | Compact range and enough memory |
| Radix | Stable passes over digits | Integer keys, base-256 passes |
| Linear | Scan for equality | Few queries; no index |
| Binary | Halve an ordered interval | Sorted data or explicit preprocessing |
| Hash | Bucket then test equality | Many queries; index cost included |
| BFS | FIFO layers | Traversal or unit-weight shortest paths |
| DFS | Depth then backtrack | Reachability and discovery tree |
| Dijkstra | Minimum tentative distance | Single source, nonnegative weights |
| Bellman–Ford | Repeated relaxation | Single source with negative edges |
| Floyd–Warshall | Allow intermediate vertices | All-pairs distances |

Symbols: n = values; q = queries; I = inversions; k = integer range; L = maximum string length; V = vertices; E = edges; d = digit passes; b = radix base, here 256.

Big-O is an asymptotic upper bound, not milliseconds. Auxiliary space excludes input in the algorithm model; returned copies and representation building can add memory. Stable means equal-key relative order is preserved. Relaxation tests whether a route through an edge improves a distance. An invariant is a statement maintained while an algorithm runs.

Avoid these claims: “always fastest,” “87 means 87% confidence,” “all operations are constant time for strings,” “animation time is runtime,” “history trains an ML model,” or “finite measurements prove Big-O.” Replace each with the precise implemented behavior explained in this guide.

<!-- PAGE -->
# 25 Source map and further study

The project files below are the authority for implementation-specific claims, constants and behavior. Paths are relative to D:\college\Sem_5\DAA\P2. Use the function names to find the relevant code during a demonstration.

| ID | Files and important entry points |
| S1 | frontend/lib/parse-data.ts; frontend/hooks/workspace.tsx; frontend/features/selector/input-panel.tsx; frontend/next.config.ts |
| S2 | backend/app/schemas/requests.py: ExperimentInput, EmpiricalInput, validate_sequence |
| S3 | backend/app/profiling/profiler.py: profile_data, inversion_count, profile_graph |
| S4 | backend/app/selection/engine.py: select; backend/app/core/config.py: WEIGHTS; backend/app/complexity/catalog.py |
| S5 | backend/app/algorithms/sorting/*.py; backend/app/algorithms/searching/__init__.py; backend/app/algorithms/graph/__init__.py |
| S6 | backend/app/algorithms/trace.py; backend/app/algorithms/metrics.py; backend/app/benchmarking/runner.py; backend/app/benchmarking/jobs.py |
| S7 | backend/app/history/store.py: initialize, save, evidence, list_experiments; backend/app/api/routes.py: history |
| S8 | backend/app/main.py; backend/app/api/routes.py; frontend/features/visualizer/visualizer.tsx; frontend/features/complexity/complexity.tsx |
| S9 | backend/tests/; frontend/tests/; README.md; docs/how-analysis-works.md |

## Primary teaching references
T1. MIT OpenCourseWare, Introduction to Algorithms, Fall 2011, Lecture 7, Counting Sort, Radix Sort, Lower Bounds for Sorting. Supports the distinction between comparison sorting and algorithms using integer key structure.
https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/resources/lecture-7-counting-sort-radix-sort-lower-bounds-for-sorting/

T2. MIT OpenCourseWare, Introduction to Algorithms, Spring 2020, Recitation 14. Reviews shortest-path algorithm requirements and the relationship between graph properties and algorithm choice.
https://live.ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/6027e2a155c948937fdfb93981f7070c_MIT6_006S20_r14.pdf

The textbook bounds are interpreted alongside the actual code. Examples include the O(n) search ordering check, returned sorting copies, Bellman’s vertex-loop overhead on very sparse inputs, and the specific Quick/Heap behavior on equal values. Keeping that distinction clear makes an implementation explanation technically defensible.

For rehearsal, close this guide and explain one input through validation, profiling, eligibility, scoring, execution, verification and feedback. Then explain one algorithm using its precondition, invariant and complexity. If a step is unclear, revisit that section rather than memorizing the final recommendation.

<!-- PAGE -->
# 26 The four score components in plain language

Each algorithm receives four component values between zero and one. Their weights give maximum contributions of 40, 30, 15 and 15 points, for a total of 100. These percentages express the designer's priorities; they are not portions of measured execution time or probabilities that an algorithm is correct. [S4, S7]

## Estimated complexity contributes up to 40 points
Question: how much work do we expect this implementation to do on the submitted input? We substitute the measured size and properties into work formulas. Insertion uses n+I; Quick uses n log2(n) with a duplicate adjustment; Counting uses n+k. Lower estimated work gives a larger normalized complexity component.

Example: with six values and eight inversions, Insertion estimates 6+8=14 work units, while Quick estimates about 15.51 with no duplicates. Insertion therefore receives 40 points and Quick about 38.00 here. Big-O helps design these models, but the result is a heuristic work estimate, not seconds.

## Input data fit contributes up to 30 points
Question: how strongly do our predefined rules favor this algorithm for this data pattern? Insertion's fit falls as inversions increase. Quick has a strong general fit and a duplicate bonus. Counting's fit falls as its range grows relative to n. Searching uses query count, ordering and expected-update settings.

These values are fixed formulas, not learned confidence scores. In your six-value example, Insertion fit is about 0.4842 and Quick fit is 0.85. Their contributions are 14.53 and 25.50 points. That large difference favors Quick even though the complexity estimate favors Insertion. Using inversions in both work and fit can reinforce the same signal; the components are not statistically independent.

## Memory preference contributes up to 15 points
Question: how much does the design prefer this algorithm's auxiliary-memory behavior? Insertion and Heap receive 1.0, Quick 0.92, Merge 0.55, Counting 0.45 and Radix 0.50. These are assigned relative preferences, not measured RAM quantities. Limited-memory settings also exclude some implementations before scoring. Benchmark memory is measured separately.

## Historical evidence contributes up to 15 points
Question: how did this algorithm perform in earlier similar measured experiments? The system aggregates fastest-time-to-candidate-time ratios with neutral smoothing. No evidence starts at 0.5, contributing 7.5 points. Better similar results raise this component, but its 15-point weight cannot always overcome the other components. It uses earlier runs, not future information from the benchmark being predicted.

<!-- PAGE -->
# 27 Your Quick versus Insertion benchmark explained

The screenshot's 110.53% gap matches saved experiment a6a2395d-b876-442c-81c7-ad7b54b88f39, recorded 12 October 2026 at 12:24 IST. Its input was [18,7,31,4,25,12]: n=6, eight inversions, no duplicates and integer range 28. The frozen selection included four similar observations for each of these candidates.

| Contribution in points | Quick Sort | Insertion Sort |
| Complexity out of 40 | 38.00 | 40.00 |
| Data fit out of 30 | 25.50 | 14.53 |
| Memory out of 15 | 13.80 | 15.00 |
| History out of 15 | 8.02 | 11.44 |
| Total suitability out of 100 | 85.32 | 80.96 |

Totals are calculated before display rounding. Quick's data-fit advantage outweighed Insertion's advantages in all three other components. So the application correctly followed its current scoring formula when it recommended Quick. The formula's prediction did not match the measured fastest candidate.

| Actual measured result | Quick Sort | Insertion Sort |
| Median runtime in milliseconds | 0.0120 | 0.0057 |
| Instrumented operations | 46 | 24 |

## Why Insertion won this run
Six elements form a tiny problem. Insertion's straightforward shifts can cost less than Quick's pivot selection, partitioning, comparisons and stack handling. The lower operation count is consistent with that explanation, although operation counters alone do not establish the exact cause of a timing difference. Big-O describes growth, not the precise fastest method at n=6.

The current Insertion fit formula penalizes eight inversions substantially, while Quick retains a strong default fit. This example therefore exposes a calibration weakness for tiny inputs. History already favored Insertion; it simply did not have enough weight to reverse the recommendation. Repeating a benchmark does not guarantee that the next recommendation will change.

## Interpret the percentage correctly
Gap = (0.0120 / 0.0057 - 1) × 100 = 110.53%. Quick took about 2.11 times Insertion's time, or 0.0063 ms more, in this run. This does not mean 110.53% incorrect output. At such short durations, repeat timings can vary, so do not generalize the ratio to larger inputs or other machines.

Viva answer: “The selector predicted Quick from a weighted suitability model, but the independent benchmark found Insertion faster on six values. The comparison exposes a small-input scoring limitation and records evidence for later selection. Prediction and measurement are intentionally shown separately.” A future improvement would evaluate a calibrated small-input preference and less overlapping work/fit signals on held-out data; no such scoring change is claimed here.
