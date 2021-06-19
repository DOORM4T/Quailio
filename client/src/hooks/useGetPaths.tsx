import { useDispatch, useSelector } from "react-redux"
import { BFS } from "../helpers/bfs"
import { IPerson } from "../store/networks/networkTypes"
import { getCurrentNetworkPeople } from "../store/selectors/networks/getCurrentNetwork"
import { setPathOverlayContent } from "../store/ui/uiActions"
import { IPathContent, IPathContentItem } from "../store/ui/uiTypes"

const DEFAULT_REASON = ""
function useGetPaths() {
  const dispatch = useDispatch()
  const currentNetworkPeople = useSelector(getCurrentNetworkPeople)
  const getPaths = (
    person1: IPerson,
    person2: IPerson,
  ): IPathContent | null => {
    const graph = _getGraph()

    const paths = BFS.findAllPaths(
      graph,
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

  const showPaths = ({ person1, person2, paths }: IPathContent) => {
    dispatch(setPathOverlayContent({ person1, person2, paths }))
  }

  return { getPaths, showPaths }

  // #region Helper Functions
  function _mapIdPathToRealPath(idPath: string[]): IPathContentItem[] {
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
      .filter((item) => item !== null) as IPathContentItem[]

    return realPath
  }

  function _getGraph() {
    // Construct the graph data structure
    const graph = new Map<string, string[]>()
    currentNetworkPeople.forEach(_setNeighbors)
    return graph

    function _setNeighbors(p: IPerson) {
      const neighbors = Object.entries(p.relationships)
        .filter(([id, value]) => {
          // Exclude one-way relationships where the current node is being pointed to
          const relPerson = currentNetworkPeople.find((rel) => rel.id === id)
          if (!relPerson) return false
          return relPerson.relationships[p.id].shape !== "arrow"
        })
        .map(([id]) => id)

      graph.set(p.id, neighbors)
    }
  }
  // #endregion Helper Functions
}

export default useGetPaths
