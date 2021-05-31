export class BFS {
  public static hasPath<T>(
    graph: Map<T, T[]>,
    start: T,
    isDesiredNode: DesiredNodeFunc<T>,
  ) {
    const searchQueue: T[] = []
    const seen: Map<T, boolean> = new Map()
    const startAdjNodes = graph.get(start) || []
    for (const adj of startAdjNodes) searchQueue.push(adj)

    while (searchQueue.length > 0) {
      const toCheck = searchQueue.shift()!
      if (seen.has(toCheck)) continue
      if (isDesiredNode(toCheck)) {
        return true
      } else {
        seen.set(toCheck, true)
        const adjNodes = graph.get(toCheck) || []
        for (const adj of adjNodes) searchQueue.push(adj)
      }
    }

    return false
  }

  public static findShortestPath<T>(
    graph: Map<T, T[]>,
    start: T,
    isDesiredNode: DesiredNodeFunc<T>,
  ) {
    const searchQueue: T[][] = []
    const seen: Map<T, boolean> = new Map([[start, true]])
    const startAdjNodes = graph.get(start) || []
    for (const adj of startAdjNodes) searchQueue.push([start, adj])

    while (searchQueue.length > 0) {
      const toCheck = searchQueue.shift()!
      const lastNode = toCheck[toCheck.length - 1]
      if (seen.has(lastNode)) continue
      if (isDesiredNode(lastNode)) {
        return toCheck
      } else {
        seen.set(lastNode, true)
        const adjNodes = graph.get(lastNode) || []
        for (const adj of adjNodes) {
          if (toCheck.includes(adj)) continue
          searchQueue.push(toCheck.concat(adj))
        }
      }
    }

    return null
  }

  public static findAllPaths<T>(
    graph: Map<T, T[]>,
    start: T,
    isDesiredNode: DesiredNodeFunc<T>,
  ) {
    const searchQueue: T[][] = []
    const seen: Map<T, boolean> = new Map([[start, true]])
    const startAdjNodes = graph.get(start) || []
    for (const adj of startAdjNodes) searchQueue.push([start, adj])
    const paths: T[][] = []

    while (searchQueue.length > 0) {
      const toCheck = searchQueue.shift()!
      const lastNode = toCheck[toCheck.length - 1]
      if (seen.has(lastNode)) continue
      if (isDesiredNode(lastNode)) {
        paths.push(toCheck)
      } else {
        seen.set(lastNode, true)
        const adjNodes = graph.get(lastNode) || []
        for (const adj of adjNodes) {
          if (toCheck.includes(adj)) continue
          searchQueue.push(toCheck.concat(adj))
        }
      }
    }

    return paths
  }
}

type DesiredNodeFunc<T> = (node: T) => boolean
