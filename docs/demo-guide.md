# Demonstrate AlgoAdapt with your own data

Start in Algorithm studio. Paste your integers (comma, space, tab, or newline separated), or upload numeric CSV/TXT/JSON. Check the parsed preview and click **Analyze input**. There is no generated starting dataset.

Click **Watch this algorithm step by step**. Choose an eligible algorithm. Use Next to explain a single comparison or move, Play/Pause for animation, Restart to begin again, and the slider to inspect a particular moment. The caption explains the operation; highlighted bars identify its positions. Sorting output is shown in the final frame and checked independently. The same Python implementation powers playback and benchmarks.

Open Benchmark lab and run the experiment. Explain why the suitability score is not a runtime or correctness probability. Playback speed is chosen for readability; measured runtime comes from separate benchmark workers.

For searching, enter the target number(s) before analyzing. Linear Search checks values sequentially; Binary Search narrows a range, with visible Merge Sort preprocessing when permitted; Hash Search builds buckets and checks a collision chain. The final frame gives a found/missing result for every query.

For graphs, paste or upload one `source,target,weight` edge per line. An optional header with those names is accepted. Add isolated node labels if needed. Apply the graph and select a task/source. The visualizer shows visited nodes, queued/stacked nodes, edges being checked, and updated distances. Floyd–Warshall shows the evolving matrix. Negative-cycle results explicitly say finite shortest paths are undefined.

Complexity lab uses increasing prefixes of the exact submitted data (up to 4,000 values). It never generates new measurement input. Its reference curves are theoretical growth functions. History preserves completed measurements, including experiments from earlier versions; it does not restore full input files.

Playback limits: 80 array values, 8 targets, or 16 nodes / 60 edges. Larger inputs can still be analyzed and benchmarked. Keep a smaller file for a legible demonstration. Input is never silently truncated for animation. Up to 4,000 frames are retained and any omitted intermediate frames are disclosed.
