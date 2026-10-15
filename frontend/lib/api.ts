export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export async function api<T>(path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error(
      "The engine is unavailable. Start the FastAPI backend on port 8000, then retry.",
    );
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data?.detail;
    throw new ApiError(
      Array.isArray(detail)
        ? detail.map((e: { msg: string }) => e.msg).join(" · ")
        : typeof detail === "string"
          ? detail
          : `Request failed (${response.status}). Check that the backend is running.`,
      response.status,
    );
  }
  return data;
}
export const format = (n?: number | null, digits = 2) =>
  n == null
    ? "—"
    : n.toLocaleString(undefined, { maximumFractionDigits: digits });
export const percent = (n?: number | null) =>
  n == null ? "—" : `${format(n * 100, 1)}%`;
export const names: Record<string, string> = {
  insertion: "Insertion Sort",
  merge: "Merge Sort",
  quick: "Quick Sort",
  heap: "Heap Sort",
  counting: "Counting Sort",
  radix: "Radix Sort",
  linear: "Linear Search",
  binary: "Binary Search",
  hash: "Hash Lookup",
  bfs: "Breadth-first Search",
  dfs: "Depth-first Search",
  dijkstra: "Dijkstra",
  bellman: "Bellman–Ford",
  floyd: "Floyd–Warshall",
};
