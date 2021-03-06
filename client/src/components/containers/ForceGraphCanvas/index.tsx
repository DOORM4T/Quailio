import deepEqual from "deep-equal"
import { ForceGraphInstance, LinkObject } from "force-graph"
import React, { CSSProperties } from "react"
import { ICurrentNetwork } from "../../../store/networks/networkTypes"
import Canvas from "../../Canvas"
import {
  createLinksByRelationships,
  createNetworkGraph,
  createPersonNode,
  IForceGraphData,
  IPersonNode,
  setNeighbors,
} from "./NetworkGraph"

/* Empty default state for when the Current Network is null */
const emptyState: ICurrentNetwork = {
  id: "",
  name: "",
  people: [],
  personIds: [],
}

const ForceGraphCanvas: React.FC<IProps> = (props) => {
  /* create a ref for forwarding to the Canvas presentational component */
  const canvasRef = React.useRef<HTMLDivElement>()
  const forceGraphRef = React.useRef<ForceGraphInstance | undefined>()
  const existingPeopleIdsRef = React.useRef<Set<string>>(new Set<string>())
  const existingPeopleIds = existingPeopleIdsRef.current

  // ==- Instantiate the Force Graph -== //
  const renderForceGraph = () => {
    const graphState = props.currentNetwork ? props.currentNetwork : emptyState

    if (canvasRef.current) {
      // Add each person's ID to the existingPeopleIds set -- this is to track existing nodes while we dynamically add new nodes
      existingPeopleIds.clear()
      graphState.people.forEach((n) => existingPeopleIds.add(n.id))

      // Create the force graph
      // Destroy the previous force graph, if there was one
      if (forceGraphRef.current) forceGraphRef.current._destructor()

      /* Set canvas width and height based on container dimensions */
      forceGraphRef.current = createNetworkGraph(
        canvasRef.current,
        graphState,
      ) as ForceGraphInstance

      // Fit the force graph canvas when the window resizes
      const handleResize = () => {
        const currentForceGraph = forceGraphRef.current
        const currentCanvasContainer = canvasRef.current
        if (!currentForceGraph || !currentCanvasContainer) return

        const { width, height } = currentCanvasContainer.getBoundingClientRect()

        currentForceGraph.width(width).height(height)
      }

      // Fit the initial force graph to the correct screen dimensions
      handleResize()

      // Re-create the force graph when the window resizes
      window.removeEventListener("resize", handleResize)
      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
        if (!forceGraphRef.current) return
        forceGraphRef.current._destructor()
      }
    }
  }

  // Render force graph on container mount or when we switch to a different network
  React.useEffect(renderForceGraph, [canvasRef, props.currentNetwork?.id])

  // Update the existing force graph when person state changes
  React.useEffect(() => {
    if (!forceGraphRef.current || !props.currentNetwork) return
    const people = props.currentNetwork.people

    const { links, nodes } = forceGraphRef.current.graphData() as {
      links: LinkObject[]
      nodes: IPersonNode[]
    }

    // This will be modified if people are added or removed
    const updatedGraphData: IForceGraphData = {
      nodes,
      links: [],
    }

    // Handle adding new people
    const peopleLen = people.length
    const existingLen = existingPeopleIds.size
    if (peopleLen > existingLen) {
      // Find the newly added person(s) -- they shouldn't be in the existingPeopleIds set
      const newPeople = people.filter((p) => !existingPeopleIds.has(p.id))

      // Add the new people to the existingPeopleIds set
      newPeople.forEach((p) => existingPeopleIds.add(p.id))

      // Create person nodes out of the new people. These nodes will be added to the force graph.
      const newPersonNodes = newPeople.map(createPersonNode)
      updatedGraphData.nodes = [...nodes, ...newPersonNodes]

      // Links shouldn't change when a new person is added
    } else if (peopleLen < existingLen) {
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
    } else if (peopleLen === existingLen) {
      // #people didn't change; check if a relationship reason or thumbnail changed
      // Get nodes that changed
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

          // Get the updated node
          if (didRelationshipsChange || didThumbnailChange || didNameChange) {
            // Merge the new node and previous node. New node properties override existing ones!
            const mergedNode = { ...n, ...nodeFromProps }

            // Map to the updated node
            return mergedNode
          } else return null
        })
        .filter((n) => n !== null) as IPersonNode[]

      // Replace the nodes whose relationships updated
      updatedNodes.forEach((n) => {
        const indexToReplace = updatedGraphData.nodes.findIndex(
          (node) => node.id === n.id,
        )

        updatedGraphData.nodes[indexToReplace] = n
      })
    }

    // Re-render all links & neighbors
    people.forEach(createLinksByRelationships(updatedGraphData))
    updatedGraphData.links.forEach(setNeighbors(updatedGraphData))

    // Update the force graph!
    forceGraphRef.current.graphData(updatedGraphData)
  }, [props.currentNetwork?.people])

  return <Canvas id={props.id} ref={canvasRef} style={props.style} />
}

export default React.memo(ForceGraphCanvas, (prevProps, nextProps) => {
  /* Rerender only if the "people" names, relationships, or thumbnail changed */
  const skipRerender = deepEqual(
    prevProps.currentNetwork?.people.map((p) => ({
      id: p.id,
      name: p.name,
      relationships: p.relationships,
      thumbnail: p.thumbnailUrl,
    })),
    nextProps.currentNetwork?.people.map((p) => ({
      id: p.id,
      name: p.name,
      relationships: p.relationships,
      thumbnail: p.thumbnailUrl,
    })),
  )

  return skipRerender
})

// ==- TYPE DEFINITIONS -== //
interface IProps {
  style?: CSSProperties
  id: string
  currentNetwork: ICurrentNetwork | null
}
