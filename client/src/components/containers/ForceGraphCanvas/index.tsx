import deepEqual from "deep-equal"
import { ForceGraphInstance, LinkObject, NodeObject } from "force-graph"
import React, { CSSProperties } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import { ICurrentNetwork } from "../../../store/networks/networkTypes"
import { IApplicationState } from "../../../store/store"
import { zoomToPerson } from "../../../store/ui/uiActions"
import Canvas from "../../Canvas"
import {
  addGroupNodeLinks as addGroupNodeLinksToForceGraph,
  clearCustomListeners,
  clearHighlights,
  createLinksByRelationships,
  createNetworkGraph,
  createPersonNode,
  groupAsPersonNode,
  highlightNode,
  IForceGraphData,
  IPersonNode,
  setNodeNeighborsAndLinks,
} from "./NetworkGraph"

/* Empty default state for when the Current Network is null */
const emptyState: ICurrentNetwork = {
  id: "",
  name: "",
  people: [],
  personIds: [],
  groupIds: [],
  relationshipGroups: {},
}

const ForceGraphCanvas: React.FC<IProps> = (props) => {
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
    if (!canvasRef.current) return
    const graphState = props.currentNetwork ? props.currentNetwork : emptyState

    // Add each person's ID to the existingPeopleIds set -- this is to track existing nodes while we dynamically add new nodes
    existingPeopleIds.clear()
    graphState.people.forEach((n) => existingPeopleIds.add(n.id))

    // Create the force graph
    // Destroy the previous force graph, if there was one
    if (forceGraphRef.current) destroyForceGraph()

    /* Set canvas width and height based on container dimensions */
    forceGraphRef.current = createNetworkGraph(
      canvasRef.current,
      graphState,
    ) as ForceGraphInstance

    // Fit the initial force graph to the correct screen dimensions
    handleResize()
    setTimeout(() => {
      if (!forceGraphRef.current) return

      forceGraphRef.current.zoomToFit(500)
    }, 100)

    window.removeEventListener("resize", handleResize)
    window.addEventListener("resize", handleResize)

    return () => {
      destroyForceGraph()
    }
  }

  // Re-creates the force graph when the window resizes
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
  React.useEffect(renderForceGraph, [canvasRef, props.currentNetwork?.id])

  // Update the existing force graph when person state changes
  React.useEffect(() => {
    if (!forceGraphRef.current || !props.currentNetwork) return
    const forceGraph = forceGraphRef.current
    const people = props.currentNetwork.people
    const groups = props.currentNetwork.relationshipGroups

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
      // Re-render links in the Graph Data
      addGroupNodeLinksToForceGraph(updatedGraphData)
      people.forEach(createLinksByRelationships(updatedGraphData))

      // Re-render links and neighbors for each node
      updatedGraphData.nodes.forEach((node) => {
        node.neighbors = []
        node.links = []
      })
      updatedGraphData.links.forEach(setNodeNeighborsAndLinks(updatedGraphData))

      // Update the force graph!
      forceGraph.graphData(updatedGraphData)

      // If the node has a pinXY, pin it after the graph re-renders
      setTimeout(() => {
        forceGraph.graphData().nodes.forEach((n, index) => {
          n.fx = updatedGraphData.nodes[index].pinXY?.x
          n.fy = updatedGraphData.nodes[index].pinXY?.y
        })
      }, 10) // Delay to give time for re-rendering -- Force-Graph seems to reset fx and fy for data upon re-render
    }

    const addPeopleToGraph = () => {
      // Find the newly added person(s) -- they shouldn't be in the existingPeopleIds set
      const newPeople = people.filter((p) => !existingPeopleIds.has(p.id))

      // Add the new people to the existingPeopleIds set
      newPeople.forEach((p) => existingPeopleIds.add(p.id))

      // Create person nodes out of the new people. These nodes will be added to the force graph.
      const newPersonNodes = newPeople.map(createPersonNode)
      updatedGraphData.nodes = [...nodes, ...newPersonNodes]

      updateGraph()

      // If a node was added, highlight it
      if (newPersonNodes.length === 1) {
        clearHighlights()
        highlightNode(
          newPersonNodes[0],
          forceGraph.graphData() as IForceGraphData,
        )
      }
    }

    const removePeopleFromGraph = () => {
      // Handle deleting people
      // Get the IDs of people in the set who no longer exist in the "people" state
      const deletedPeopleIds = Array.from(existingPeopleIds).filter(
        (id) => !people.some((p) => p.id === id),
      )

      // Remove all deleted people from the existing people Ids set
      deletedPeopleIds.forEach((id) => existingPeopleIds.delete(id))

      // Filter out the deleted people from the current force graph node data
      const updatedNodes = nodes.filter((n) => !deletedPeopleIds.includes(n.id))
      updatedGraphData.nodes = updatedNodes

      // Update the graph
      updateGraph()
    }

    const rerenderUpdatedPeopleInGraph = () => {
      // Get nodes whose changes need to be re-rendered in the Force Graph
      const updatedNodes = updatedGraphData.nodes
        .map((n) => {
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

          // Check whether the node's thumbnail changed or not
          const didThumbnailChange =
            nodeFromProps.thumbnail?.src !== n.thumbnail?.src

          // Check whether the node's name changed or not
          const didNameChange = nodeFromProps.name !== n.name

          // Check whether the node's pinXY changed or not
          const didPinChange = !deepEqual(nodeFromProps.pinXY, n.pinXY)

          // Get the updated node
          if (
            didRelationshipsChange ||
            didThumbnailChange ||
            didNameChange ||
            didPinChange
          ) {
            // Merge the new node and previous node. New node properties override existing ones!
            const mergedNode = { ...n, ...nodeFromProps }

            // Map to the updated node
            return mergedNode
          } else return null
        })
        .filter((n) => n !== null) as (IPersonNode & NodeObject)[]

      // Replace the nodes whose relationships updated
      updatedNodes.forEach((n) => {
        const indexToReplace = updatedGraphData.nodes.findIndex(
          (node) => node.id === n.id,
        )

        updatedGraphData.nodes[indexToReplace] = n
      })

      // DO NOT call updateGraph -- it will be called after other group-rerendering functions run
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
    const existingGroupNodes = (forceGraph.graphData()
      .nodes as IPersonNode[]).filter((node) => node.isGroupNode)
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
    props.currentNetwork?.people,
    props.currentNetwork?.relationshipGroups,
    props.currentNetwork?.groupIds,
  ])

  // When a new force graph is created...
  React.useEffect(() => {
    // Zoom the entire graph into view
    setTimeout(() => {
      if (!forceGraphRef.current) return
      forceGraphRef.current.zoomToFit(500)
    }, 500)
  }, [forceGraphRef])

  // Zoom in on a person node
  React.useEffect(() => {
    // Stop if null or if there's no force-graph
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
      // Ensure x and y exist
      const { x, y } = nodeToZoom
      if (x === undefined || y === undefined) return

      // Zoom into the node's coordinates!
      forceGraph.centerAt(x, y, 250).zoomToFit(500)

      // Highlight the node
      highlightNode(nodeToZoom, forceGraph.graphData() as IForceGraphData)
    }
  }, [personIdToZoom])

  return <Canvas id={props.id} ref={canvasRef} style={props.style} />
}

export default React.memo(ForceGraphCanvas, (prevProps, nextProps) => {
  const prevCurrentNetwork = prevProps.currentNetwork
  const nextCurrentNetwork = nextProps.currentNetwork

  // Rerender if the "people" names, relationships, or thumbnail changed
  const arePeopleSame = deepEqual(
    prevCurrentNetwork?.people.map((p) => ({
      id: p.id,
      name: p.name,
      relationships: p.relationships,
      thumbnail: p.thumbnailUrl,
      pinXY: p.pinXY,
    })),
    nextCurrentNetwork?.people.map((p) => ({
      id: p.id,
      name: p.name,
      relationships: p.relationships,
      thumbnail: p.thumbnailUrl,
      pinXY: p.pinXY,
    })),
  )

  // ...or if groups changed
  const areGroupsSame =
    deepEqual(
      prevCurrentNetwork?.relationshipGroups,
      nextCurrentNetwork?.relationshipGroups,
    ) &&
    prevCurrentNetwork?.groupIds.length === nextCurrentNetwork?.groupIds.length

  const skipRerender = arePeopleSame && areGroupsSame
  return skipRerender
})

// ==- TYPE DEFINITIONS -== //
interface IProps {
  style?: CSSProperties
  id: string
  currentNetwork: ICurrentNetwork | null
}
