import { useEffect, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { BFS } from "../helpers/bfs"
import { IPerson } from "../store/networks/networkTypes"
import { getCurrentNetworkPeople } from "../store/selectors/networks/getCurrentNetwork"
import { setBFSPath } from "../store/ui/uiActions"
import { IBFSDetails, IBFSPathItem } from "../store/ui/uiTypes"

const DEFAULT_REASON = ""
function useGetPaths() {
  const dispatch = useDispatch()
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

  const getPaths = (person1: IPerson, person2: IPerson): IBFSDetails | null => {
    if (!graphRef.current) return null

    const paths = BFS.findAllPaths(
      graphRef.current,
      person1.id,
      (nodeId) => nodeId === person2.id,
    )

    if (paths.length === 0) {
      window.alert(
        `No (in)direct relationship between ${person1.name} and ${person2.name}`,
      )
      return null
    }

    const pathDetails = paths.map(_mapIdPathToRealPath)
    return { person1, person2, paths: pathDetails }
  }

  const showPaths = ({ person1, person2, paths }: IBFSDetails) => {
    dispatch(setBFSPath({ person1, person2, paths }))
  }

  return { getPaths, showPaths }

  // #region Helper Functions
  function _mapIdPathToRealPath(idPath: string[]): IBFSPathItem[] {
    const realPath = idPath
      .map((id, index) => {
        const node = currentNetworkPeople.find((p) => p.id === id)
        if (!node) return null
        const prevIndex = index - 1
        let prevNodeId = null
        if (prevIndex >= 0 && prevIndex < idPath.length)
          prevNodeId = idPath[prevIndex]

        return {
          id,
          name: node.name,
          description: prevNodeId
            ? node.relationships[prevNodeId]?.reason || DEFAULT_REASON
            : DEFAULT_REASON,
        }
      })
      .filter((item) => item !== null) as IBFSPathItem[]

    return realPath
  }
  // #endregion Helper Functions
}

export default useGetPaths
