from collections import deque
from heapq import heappop, heappush
from math import inf


def adjacency(nodes, edges, directed):
    adj = {v: [] for v in nodes}
    for e in edges:
        adj[e["source"]].append((e["target"], e["weight"]))
        if not directed and e["source"] != e["target"]:
            adj[e["target"]].append((e["source"], e["weight"]))
    return adj


def clean(dist):
    return {k: None if v == inf else v for k, v in dist.items()}


def walk(nodes, edges, directed, source, m, depth=False, **kwargs):
    adj = adjacency(nodes, edges, directed)
    if not nodes:
        return {"order": [], "distances": {}, "parents": {}}
    todo, seen, order, parents = deque([source]), {source}, [], {}
    dist = {v: inf for v in nodes}
    dist[source] = 0
    while todo:
        u = todo.pop() if depth else todo.popleft()
        order.append(u)
        if m.observer:
            m.emit(
                f"Visit {u} from the queue.",
                current=u,
                visited=order,
                frontier=list(todo),
                distances=clean(dist),
                phase="visit",
            )
        m.visits += 1
        for v, _ in adj[u]:
            m.comparisons += 1
            if v not in seen:
                seen.add(v)
                todo.append(v)
                parents[v] = u
                dist[v] = dist[u] + 1
                if m.observer:
                    m.emit(
                        f"Discover {v} from {u}; add it to the queue.",
                        current=v,
                        edge=[u, v],
                        visited=order,
                        frontier=list(todo),
                        distances=clean(dist),
                        phase="discover",
                    )
    return {"order": order, "distances": clean(dist), "parents": parents}


def bfs(*args, **kwargs):
    return walk(*args, **kwargs)


def dfs(nodes, edges, directed, source, m, **kwargs):
    adj = adjacency(nodes, edges, directed)
    if not nodes:
        return {"order": [], "distances": {}, "parents": {}}
    seen, order, parents = {source}, [source], {}
    dist = {v: inf for v in nodes}
    dist[source] = 0
    stack = [(source, iter(adj[source]))]
    m.visits += 1
    if m.observer:
        m.emit(
            f"Start depth-first search at {source}.",
            current=source,
            visited=order,
            frontier=[source],
            distances=clean(dist),
            phase="visit",
        )
    # Iterator frames preserve actual depth-first discovery and parent edges.
    while stack:
        u, neighbors = stack[-1]
        try:
            v, _ = next(neighbors)
        except StopIteration:
            stack.pop()
            if m.observer:
                m.emit(
                    f"Backtrack from {u}.",
                    current=u,
                    visited=order,
                    frontier=[x[0] for x in stack],
                    distances=clean(dist),
                    phase="backtrack",
                )
            continue
        m.comparisons += 1
        if v not in seen:
            seen.add(v)
            order.append(v)
            parents[v] = u
            dist[v] = dist[u] + 1
            m.visits += 1
            stack.append((v, iter(adj[v])))
            if m.observer:
                m.emit(
                    f"Follow {u} to unvisited node {v}.",
                    current=v,
                    edge=[u, v],
                    visited=order,
                    frontier=[x[0] for x in stack],
                    distances=clean(dist),
                    phase="discover",
                )
    return {"order": order, "distances": clean(dist), "parents": parents}


def dijkstra(nodes, edges, directed, source, m, **kwargs):
    if any(e["weight"] < 0 for e in edges):
        raise ValueError("Dijkstra requires non-negative weights.")
    if not nodes:
        return {"distances": {}, "parents": {}}
    adj = adjacency(nodes, edges, directed)
    dist, parents, heap = {v: inf for v in nodes}, {}, [(0, source)]
    dist[source] = 0
    visited = []
    while heap:
        cost, u = heappop(heap)
        m.visits += 1
        if cost != dist[u]:
            continue
        visited.append(u)
        if m.observer:
            m.emit(
                f"Settle {u}, the nearest queued node at distance {cost}.",
                current=u,
                visited=visited,
                frontier=[x[1] for x in heap],
                distances=clean(dist),
                phase="settle",
            )
        for v, weight in adj[u]:
            if m.observer:
                m.emit(
                    f"Check edge {u} → {v} with weight {weight}.",
                    current=u,
                    edge=[u, v],
                    visited=visited,
                    distances=clean(dist),
                    phase="check edge",
                )
            m.comparisons += 1
            if cost + weight < dist[v]:
                dist[v] = cost + weight
                parents[v] = u
                m.moves += 1
                heappush(heap, (dist[v], v))
                if m.observer:
                    m.emit(
                        f"Improve distance to {v}: {dist[v]} via {u}.",
                        current=v,
                        edge=[u, v],
                        visited=visited,
                        distances=clean(dist),
                        phase="relax",
                    )
    return {"distances": clean(dist), "parents": parents}


def bellman(nodes, edges, directed, source, m, **kwargs):
    if not nodes:
        return {"distances": {}, "parents": {}}
    adj = adjacency(nodes, edges, directed)
    dist, parents = {v: inf for v in nodes}, {}
    dist[source] = 0
    for round_index in range(len(nodes) - 1):
        if m.observer:
            m.emit(f"Relaxation round {round_index + 1}.", distances=clean(dist), phase="round")
        changed = False
        for u in nodes:
            for v, w in adj[u]:
                m.comparisons += 1
                if dist[u] + w < dist[v]:
                    dist[v] = dist[u] + w
                    parents[v] = u
                    changed = True
                    m.moves += 1
                    if m.observer:
                        m.emit(
                            f"Improve distance to {v}: {dist[v]} via {u}.",
                            current=v,
                            edge=[u, v],
                            distances=clean(dist),
                            phase="relax",
                        )
        if not changed:
            break
    for u in nodes:
        for v, w in adj[u]:
            m.comparisons += 1
            if dist[u] + w < dist[v]:
                if m.observer:
                    m.emit(
                        "A reachable negative cycle still improves a distance; no finite shortest-path solution.",
                        edge=[u, v],
                        distances=clean(dist),
                        phase="negative cycle",
                    )
                return {"negative_cycle": True}
    return {"distances": clean(dist), "parents": parents, "negative_cycle": False}


def floyd(nodes, edges, directed, source, m, **kwargs):
    dist = {u: {v: 0 if u == v else inf for v in nodes} for u in nodes}
    for u, neighbors in adjacency(nodes, edges, directed).items():
        for v, w in neighbors:
            dist[u][v] = min(dist[u][v], w)
    for k in nodes:
        if m.observer:
            m.emit(
                f"Allow {k} as an intermediate node.",
                current=k,
                matrix={u: clean(row) for u, row in dist.items()},
                phase="intermediate",
            )
        for u in nodes:
            for v in nodes:
                m.comparisons += 1
                if dist[u][k] + dist[k][v] < dist[u][v]:
                    dist[u][v] = dist[u][k] + dist[k][v]
                    m.moves += 1
                    if m.observer:
                        m.emit(
                            f"Improve {u} → {v} via {k}: {dist[u][v]}.",
                            current=k,
                            edge=[u, v],
                            matrix={x: clean(row) for x, row in dist.items()},
                            phase="relax",
                        )
    if any(dist[v][v] < 0 for v in nodes):
        return {"negative_cycle": True}
    return {"all_pairs": {u: clean(row) for u, row in dist.items()}, "negative_cycle": False}


GRAPH = {"bfs": bfs, "dfs": dfs, "dijkstra": dijkstra, "bellman": bellman, "floyd": floyd}
