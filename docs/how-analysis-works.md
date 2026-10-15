# How AlgoAdapt analyzes and chooses

The user supplies values; the program computes their properties. It does not ask you to label a dataset “sorted” or “reversed,” and it does not need to run every candidate to make its initial recommendation.

## 1. Parse and validate

In Algorithm studio, choose **Integers** or **Text / alphanumeric**. Type directly or upload CSV, TXT, or a JSON array. Both methods go through the same parser. Data remains a draft until you click **Analyze input** or use Ctrl+Enter (Cmd+Enter on Mac). Enter alone in the data field adds a newline; Enter in the search targets field submits. Sorting does not parse unused search targets.

Commas, semicolons, whitespace, tabs, and newlines separate values. In text mode, quote phrases such as `"New York"`, and use `"a""b"` for a quoted CSV value containing a quotation mark. JSON text arrays must contain strings, such as `["0012", "A2"]`. Omit file headings: every supplied cell is data. A table becomes one list in reading order; this is not a row-record sorting tool.

Each request uses either integers or text throughout; search targets use the same type. Negative integers are valid. Decimal numeric sorting and mixed numeric/string API arrays are not supported. Numeric-looking IDs remain strings in text mode.

## 2. Measure the data using algorithms

For the integer input `[3, -1, 2, 2]`:

| Property | How it is measured | Result | Cost |
|---|---|---|---|
| Length | Read the array length | 4 | O(1), after parsing |
| Minimum / maximum | Scan and compare values | -1 / 3 | O(n) comparisons |
| Range | maximum − minimum + 1 | 5 | O(1) after min/max |
| Unique / duplicates | Insert values into a set | 3 unique; 25% duplicates | Expected O(n) integer work |
| Adjacent order | Count neighboring pairs where left ≤ right | 2 of 3; 66.7% | O(n) comparisons |
| Reverse adjacent order | Count pairs where left ≥ right | 2 of 3; 66.7% | O(n) comparisons |
| Exact inversions | Merge-sort-based divide and conquer | 3 | O(n log n) comparisons |

An inversion is a pair in the wrong order, even if its elements are not neighbors. Here `3` appears before `-1`, `2`, and `2`: three inversions. During merging, if the next right-side value is smaller than the next left-side value, every remaining value in the sorted left half also exceeds it. The analyzer adds that whole count at once. Its recurrence is T(n) = 2T(n/2) + O(n), giving O(n log n), with O(n) auxiliary space. It works on copies and preserves the submitted order.

A dataset is fully nondecreasing when every neighboring pair passes; the selector also uses zero inversions for this test. Reverse adjacent order is descriptive; there is no separate “reverse dataset” shortcut in the current ranking formula. Positive/negative counts are not separate ranking inputs: the numeric minimum, maximum, and range capture the relevant information. Negative numbers alone do not exclude Counting or Radix Sort because these implementations offset by the minimum.

For text, the same comparisons measure order and inversions. The analyzer also measures unique values, duplicates, average length, and maximum length. Numeric range and numeric histogram are not applicable. Sorting uses **case-sensitive Unicode lexicographic order**: compare characters from left to right; the first difference decides, and a shorter matching prefix comes first. Thus `A10 < A2`, `Apple < apple`. This is not natural-number ordering or locale-specific dictionary collation. No case folding or Unicode normalization is applied.

A string comparison can inspect up to L characters, so worst-case profiling becomes O(L n log n). Set hashing also reads string contents. The DAA assumption that every comparison is constant-time must be qualified for strings.

## 3. Exclude, estimate, and rank

Sorting filters enforce stability/memory constraints and integer range allocation limits. The current Counting and Radix implementations accept integer keys only, so text leaves Insertion, Merge, Quick, and Heap Sort.

The sorting work estimates include `n + inversions` for Insertion, `n log₂ n` for Merge, a duplicate-adjusted `n log₂ n` for Quick, `2n log₂ n` for Heap, `n + range` for Counting, and a base-256 pass estimate for Radix. These are heuristics, not exact operation counts or elapsed time. Fit, memory, and history provide other signals.

Each eligible candidate gets:

`score = 100 × (0.40 × complexity + 0.30 × fit + 0.15 × memory + 0.15 × history)`

The complexity component is `sqrt(minimum eligible estimated work / candidate estimated work)`. No matching history means a neutral history component of 0.5. The highest score is recommended. This is a rule-based suitability estimate, not an ML prediction or a guarantee of the fastest runtime. Text estimates count value-level work and do not model actual shared-prefix character costs.

Searching considers the number of queries, whether the input is ordered, permission to preprocess, expected updates, and memory constraints. Linear Search scans; Binary Search narrows a sorted interval; Hash Lookup builds buckets and checks equality within collision chains. Binary Search on unsorted data requires explicit sorting permission. Preprocessing/index construction is included in benchmark timing. Text hash buckets use a deterministic character-by-character polynomial hash; collisions never count as matches without an equality check.

Graph analysis scans the nodes and edges: V, E, density, direction, weights, and negative edges. Profiling is O(V + E). Task constraints matter too: traversal permits BFS/DFS; single-source weighted paths can use Dijkstra only without negative edges; Bellman–Ford handles negative edges; all-pairs selects Floyd–Warshall. Graph labels may be words or IDs, while edge weights stay integers.

## 4. Why the answer feels immediate

The initial request performs parsing, validation, profiling, a small fixed candidate ranking, and a bounded history lookup. It does not benchmark every algorithm. Small inputs usually finish quickly; there is no artificial wait. Runtime still grows with input size and string length and depends on the machine and saved history.

Playback then records the chosen implementation's real operations and displays them at a deliberately slow teaching speed. That animation duration is not algorithm runtime.

Benchmark lab performs warmup and repeated real executions in isolated workers, verifies output, and reports the median timed execution and separate memory measurement. It excludes initial input profiling and ranking. A fair evaluation of automatic selection must account for:

`profiling + selection + chosen algorithm execution`

For tiny inputs, profiling can cost more than just sorting. Exact inversions already require O(n log n) work; this project prioritizes transparent educational analysis, not guaranteed end-to-end acceleration. Operation counters count value comparisons, moves, and visits, not individual characters processed.

## Demonstrate text and IDs

Choose **Text / alphanumeric** and type:

```text
banana, A2, A10, apple, 0012, "New York"
```

Expected sorted result:

```json
["0012", "A10", "A2", "New York", "apple", "banana"]
```

For searching, use targets:

```text
apple, APPLE, 0012, 12, "New York"
```

Expected membership: `[true, false, true, false, true]`. Enable sort preprocessing to demonstrate Binary Search on the unsorted input. The text cards preserve exact values; the active comparison/move is highlighted. Use Benchmark lab to compare all eligible algorithms, and Complexity lab to measure increasing prefixes. Numeric and text experiments are kept separate when matching historical evidence.
