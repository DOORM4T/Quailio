import deepEqual from "deep-equal"
import { ForceGraphInstance, LinkObject } from "force-graph"
import React, { CSSProperties } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import { ICurrentNetwork, IPerson } from "../../../store/networks/networkTypes"
import { IApplicationState } from "../../../store/store"
import { zoomToPerson } from "../../../store/ui/uiActions"
import Canvas from "../../Canvas"
import {
  addGroupNodeLinks,
  clearCustomListeners,
  clearHighlights,
  createLinksByRelationships,
  createNetworkGraph,
  createPersonNode,
  groupAsPersonNode,
  highlightNode,
  setNodeNeighborsAndLinks,
  sortNodesBySize,
} from "./NetworkGraph"
import { IForceGraphData, IPersonNode } from "./networkGraphTypes"

const ForceGraphCanvas: React.FC<IProps> = ({
  currentNetwork,
  id: graphId,
  style,
}) => {
  // create a ref for forwarding to the Canvas presentational component
  const canvasRef = React.useRef<HTMLDivElement>()
  const forceGraphRef = React.useRef<ForceGraphInstance | undefined>()
  const existingPeopleIdsRef = React.useRef<Set<string>>(new Set<string>())
  const existingPeopleIds = existingPeopleIdsRef.current

  // Global state tracking a person to zoom-in on
  const dispatch: Dispatch<any> = useDispatch()
  const personIdToZoom = useSelector(
    (state: IApplicationState) => state.ui.personInZoom,
  )

  // ==- Instantiate the Force Graph -== //
  const renderForceGraph = () => {
    if (forceGraphRef.current) destroyForceGraph()
    if (!canvasRef.current || !currentNetwork) return

    // Add each person's ID to the existingPeopleIds set -- this is to track existing nodes while we dynamically add new nodes
    existingPeopleIds.clear()
    currentNetwork.people.forEach((n) => existingPeopleIds.add(n.id))

    forceGraphRef.current = createNetworkGraph(
      canvasRef.current,
      currentNetwork,
    ) as ForceGraphInstance

    handleResize()
    window.removeEventListener("resize", handleResize)
    window.addEventListener("resize", handleResize)

    return () => {
      destroyForceGraph()
    }
  }

  function handleResize() {
    const currentForceGraph = forceGraphRef.current
    const currentCanvasContainer = canvasRef.current
    if (!currentForceGraph || !currentCanvasContainer) return

    const { width, height } = currentCanvasContainer.getBoundingClientRect()

    currentForceGraph.width(width).height(height)
  }

  // Destroy the graph and related listeners to prevent memory leaks
  function destroyForceGraph() {
    if (!forceGraphRef.current) return
    forceGraphRef.current._destructor()
    forceGraphRef.current = undefined
    window.removeEventListener("resize", handleResize)

    // This does not work upon component unmount because canvasRef becomes undefined
    // BUT this works as intended when the user opens an new network, removing any previous listeners
    if (!canvasRef.current) return
    clearCustomListeners(canvasRef.current)
  }

  // Render force graph on container mount or when we switch to a different network
  React.useEffect(renderForceGraph, [canvasRef, currentNetwork?.id])

  // Update the existing force graph when people or groups change
  React.useEffect(() => {
    if (!forceGraphRef.current || !currentNetwork) return
    const forceGraph = forceGraphRef.current
    const people = currentNetwork.people
    const groups = currentNetwork.relationshipGroups

    const { links, nodes } = forceGraphRef.current.graphData() as {
      links: LinkObject[]
      nodes: IPersonNode[]
    }

    // This will be modified if people are added or removed
    const updatedGraphData: IForceGraphData = {
      nodes,
      links: [],
    }

    // Reusable function to update the graph using the updatedGraphData object
    const updateGraph = () => {
      sortNodesBySize(updatedGraphData)

      people.forEach(createLinksByRelationships(updatedGraphData))
      addGroupNodeLinks(updatedGraphData)

      // Refresh links and neighbors for each node (This is for highlighting)
      updatedGraphData.nodes.forEach((node) => {
        node.neighbors = []
        node.links = [] // These links are different from the graphData links, which handle the actual drawn links
      })
      updatedGraphData.links.forEach(setNodeNeighborsAndLinks(updatedGraphData))

      // Update the force graph!
      forceGraph.graphData(updatedGraphData)

      // Pin nodes at a delay -- Force-Graph seems to reset fx and fy for data upon re-render
      const pinNodes = () => {
        forceGraph.graphData().nodes.forEach((n, index) => {
          if (!n) return

          const pin = updatedGraphData.nodes[index]?.pinXY
          if (!pin) return

          n.fx = pin.x
          n.fy = pin.y
        })
      }
      setTimeout(pinNodes, 10)
    }

    const addPeopleToGraph = () => {
      // Find the newly added person(s) -- they shouldn't be in the existingPeopleIds set
      const newPeople = people.filter((p) => !existingPeopleIds.has(p.id))

      // Add the new people to the existingPeopleIds set
      newPeople.forEach((p) => existingPeopleIds.add(p.id))

      // Create person nodes out of the new people. These nodes will be added to the force graph.
      const newPersonNodes = newPeople.map(createPersonNode)
      updatedGraphData.nodes = [...nodes, ...newPersonNodes]

      // No links are created when new people are added
      //

      updateGraph()
      // If a node was added, highlight it
      if (newPersonNodes.length === 1) {
        clearHighlights()
        highlightNode(newPersonNodes[0])
      }
    }

    const removePeopleFromGraph = () => {
      const wasRemoved = (id: string) => !people.some((p) => p.id === id)
      const deletedPeopleIds = Array.from(existingPeopleIds).filter(wasRemoved)

      const removeFromExisting = (id: string) => existingPeopleIds.delete(id)
      deletedPeopleIds.forEach(removeFromExisting)

      const keepIfExisting = (n: IPersonNode) =>
        !deletedPeopleIds.includes(n.id)
      const nodesWithoutRemoved = nodes.filter(keepIfExisting)
      updatedGraphData.nodes = nodesWithoutRemoved

      // Update the graph
      updateGraph()
    }

    const rerenderUpdatedPeopleInGraph = () => {
      // Get nodes whose changes need to be re-rendered in the Force Graph
      const updatedNodes = updatedGraphData.nodes
        .map(asUpdatedNode)
        .filter((n) => n !== null) as IPersonNode[]

      updatedNodes.forEach(replaceUpdatedInGraph)

      // DO NOT call updateGraph -- it will be called after other group-rerendering functions run

      // #region rerenderUpdatedPeopleInGraph: HELPERS
      function asUpdatedNode(n: IPersonNode) {
        // Get the node from the people props field
        const personFromProps = people.find((p) => p.id === n.id)
        if (!personFromProps) return null // The node is missing? Something went wrong. Return null.

        // Create a force-graph node out of the person's data
        const nodeFromProps = createPersonNode(personFromProps)

        // Check if the node's relationships field is different from the props node's relationships
        const didRelationshipsChange = !deepEqual(
          nodeFromProps.relationships,
          n.relationships,
        )

        const didThumbnailChange =
          nodeFromProps.thumbnail?.src !== n.thumbnail?.src
        const didNameChange = nodeFromProps.name !== n.name
        const didPinChange = !deepEqual(nodeFromProps.pinXY, n.pinXY)
        const didScaleChange = !deepEqual(nodeFromProps.scaleXY, n.scaleXY)
        const didBackgroundToggle =
          nodeFromProps.isBackground !== n.isBackground

        const doUpdate =
          didRelationshipsChange ||
          didThumbnailChange ||
          didNameChange ||
          didPinChange ||
          didScaleChange ||
          didBackgroundToggle
        if (!doUpdate) return null

        // Merge the new node and previous node. New node properties override existing ones!
        const mergedNode = { ...n, ...nodeFromProps }

        // Map to the updated node
        return mergedNode
      }

      function replaceUpdatedInGraph(n: IPersonNode) {
        const indexToReplace = updatedGraphData.nodes.findIndex(
          (node) => node.id === n.id,
        )

        updatedGraphData.nodes[indexToReplace] = n
      }

      // #endregion rerenderUpdatedPeopleInGraph: HELPERS
    }

    const rerenderUpdatedGroupsInGraph = () => {
      const nodeToUpdatedNodeWithIndex = (n: IPersonNode, index: number) => {
        if (!n.isGroupNode || !n || !groups[n.id]) return null

        const groupNode = groupAsPersonNode(n.id, groups[n.id])
        const arePinsSame = groupNode.pinXY === n.pinXY
        const areNamesSame = groupNode.name === n.name
        const areSame = arePinsSame && areNamesSame
        if (!areSame) return { groupNode, index }
        return null
      }
      const updated = updatedGraphData.nodes.map(nodeToUpdatedNodeWithIndex)
      const updatedWithoutNull = updated.filter((obj) => obj !== null) as {
        groupNode: IPersonNode
        index: number
      }[]

      updatedWithoutNull.forEach(
        (obj) => (updatedGraphData.nodes[obj.index] = obj.groupNode),
      )

      // DO NOT call updateGraph -- will be called at the end of the calling block
    }

    const addRemoveGroupInGraph = () => {
      const addGroup = () => {
        const ids = new Set(Object.keys(groups))
        const removeIdFromIds = (n: IPersonNode) => {
          if (!n.isGroupNode) return
          ids.delete(n.id)
        }
        updatedGraphData.nodes.forEach(removeIdFromIds)

        const addNodeToGraphById = (id: string) =>
          updatedGraphData.nodes.push(groupAsPersonNode(id, groups[id]))
        ids.forEach(addNodeToGraphById)
      }

      const removeGroup = () => {
        const nodeIds = updatedGraphData.nodes.map((n) => n.id)
        const idSet = new Set(nodeIds)
        const removeIdFromIds = (id: string) => {
          idSet.delete(id)
        }
        Object.keys(groups).forEach(removeIdFromIds)

        const keepNode = (n: IPersonNode) => {
          if (n.isGroupNode && idSet.has(n.id)) return false
          return true
        }
        updatedGraphData.nodes = updatedGraphData.nodes.filter(keepNode)
      }

      const didAddGroup = numNewGroups > existingGroupNodes.length
      if (didAddGroup) addGroup()
      else removeGroup()

      // DO NOT call updateGraph -- will be called at the end of the calling block
    }

    const peopleLen = people.length
    const existingLen = existingPeopleIds.size
    const existingGroupNodes = (
      forceGraph.graphData().nodes as IPersonNode[]
    ).filter((node) => node.isGroupNode)
    const numNewGroups = groups ? Object.keys(groups).length : 0
    const didNumGroupsChange = existingGroupNodes.length !== numNewGroups

    if (peopleLen > existingLen) {
      addPeopleToGraph()
    } else if (peopleLen < existingLen) {
      removePeopleFromGraph()
    } else if (peopleLen === existingLen) {
      // #people didn't change; relationship reason, thumbnail, or pinXY changed
      rerenderUpdatedPeopleInGraph()

      if (didNumGroupsChange) {
        // OR a group was added or removed
        addRemoveGroupInGraph()
      } else {
        // OR a group name/color/pinXY changed
        rerenderUpdatedGroupsInGraph()
      }
      updateGraph()
    }
  }, [
    currentNetwork?.people,
    currentNetwork?.relationshipGroups,
    currentNetwork?.groupIds,
  ])

  // Zoom in on a person node
  React.useEffect(() => {
    if (!personIdToZoom || !forceGraphRef.current) {
      clearHighlights()
      return
    }

    // Get the node to zoom in on
    const forceGraph = forceGraphRef.current
    const nodes = forceGraph.graphData().nodes
    const nodeToZoom = nodes.find((n) => n.id === personIdToZoom)

    if (!nodeToZoom) {
      // Clear the zoom global state if the node doesn't exist
      dispatch(zoomToPerson(null))
      return
    } else {
      const { x, y } = nodeToZoom
      if (x === undefined || y === undefined) return

      forceGraph.centerAt(x, y, 250)
      clearHighlights()
      highlightNode(nodeToZoom)
    }
  }, [personIdToZoom])

  return <Canvas id={graphId} ref={canvasRef} style={style} />
}

export default React.memo(ForceGraphCanvas, (prevProps, nextProps) => {
  const prevCurrentNetwork = prevProps.currentNetwork
  const nextCurrentNetwork = nextProps.currentNetwork

  const areNumPeopleSame =
    prevCurrentNetwork?.personIds.length ===
    nextCurrentNetwork?.personIds.length

  // Rerender if the "people" names, relationships, thumbnail, pinXY, or scaleXY changed
  const toCheckParams = (p: IPerson) => ({
    id: p.id,
    name: p.name,
    relationships: p.relationships,
    thumbnail: p.thumbnailUrl,
    pinXY: p.pinXY,
    scaleXY: p.scaleXY,
    isBackground: p.isBackground,
  })
  const arePeopleSame = deepEqual(
    prevCurrentNetwork?.people.map(toCheckParams),
    nextCurrentNetwork?.people.map(toCheckParams),
  )

  // ...or if groups changed
  const areGroupsSame =
    deepEqual(
      prevCurrentNetwork?.relationshipGroups,
      nextCurrentNetwork?.relationshipGroups,
    ) &&
    prevCurrentNetwork?.groupIds.length === nextCurrentNetwork?.groupIds.length

  const skipRerender = areNumPeopleSame && arePeopleSame && areGroupsSame
  return skipRerender
})

// ==- TYPE DEFINITIONS -== //
interface IProps {
  style?: CSSProperties
  id: string
  currentNetwork: ICurrentNetwork | null
}
