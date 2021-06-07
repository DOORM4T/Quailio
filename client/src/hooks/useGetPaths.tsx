import { useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import { BFS } from "../helpers/bfs"
import { IPerson } from "../store/networks/networkTypes"
import { getCurrentNetworkPeople } from "../store/selectors/networks/getCurrentNetwork"

function useGetPaths() {
  const currentNetworkPeople = useSelector(getCurrentNetworkPeople)
  const graphRef = useRef<Map<string, string[]> | null>(null)

  useEffect(() => {
    // Construct the graph data structure
    graphRef.current = new Map<string, string[]>()
    currentNetworkPeople.forEach(setNeighbors)

    function setNeighbors(p: IPerson) {
      const neighbors = Object.keys(p.relationships)
      graphRef.current!.set(p.id, neighbors)
    }
  }, [currentNetworkPeople])

  const getPaths = (person1: IPerson, person2: IPerson) => {
    if (!graphRef.current) return

    const paths = BFS.findAllPaths(
      graphRef.current,
      person1.id,
      (nodeId) => nodeId === person2.id,
    )

    if (paths.length === 0) {
      window.alert(
        `No (in)direct relationship between ${person1.name} and ${person2.name}`,
      )
      return
    }

    // TODO: Return raw path data
    const pathsMsg = _prettyPath(paths)
    console.log(pathsMsg)
    window.alert(pathsMsg)
  }
  return { getPaths }

  // #region Helper Functions
  function _prettyPath(paths: string[][]) {
    return paths
      .map(
        (path) =>
          "=============\n" +
          _mapIdPathToRealPath(path)
            .map(
              (p, num) =>
                `${num + 1}.  ${p.name}${p.reason ? `  |  ${p.reason}` : ""}`,
            )
            .join("\n"),
      )
      .join("\n\n")
  }

  function _mapIdPathToRealPath(idPath: string[]) {
    const realPath = idPath.map((id, index) => {
      const node = currentNetworkPeople.find((p) => p.id === id)
      const prevIndex = index - 1
      let prevNodeId = null
      if (prevIndex >= 0 && prevIndex < idPath.length)
        prevNodeId = idPath[prevIndex]

      return {
        name: node?.name,
        reason: prevNodeId
          ? node?.relationships[prevNodeId]?.reason || null
          : null,
      }
    })

    return realPath
  }
  // #endregion Helper Functions
}

export default useGetPaths
