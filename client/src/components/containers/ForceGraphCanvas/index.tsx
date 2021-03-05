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
  const container = canvasRef.current
  const forceGraph = forceGraphRef.current
  const existingPeopleIds = existingPeopleIdsRef.current

  // ==- Instantiate the Force Graph -== //
  React.useEffect(() => {
    const graphState = props.state ? props.state : emptyState

    if (container) {
      // Add each person's ID to the existingPeopleIds set -- this is to track existing nodes while we dynamically add new nodes
      graphState.people.forEach((n) => existingPeopleIds.add(n.id))

      /* set canvas width and height based on container dimensions */
      forceGraphRef.current = createNetworkGraph(
        container,
        graphState,
      ) as ForceGraphInstance

      const handleResize = () => {
        if (!forceGraph) return

        const w = container.clientWidth
        const h = container.clientHeight
        forceGraph.width(w)
        forceGraph.height(h)
        forceGraph.centerAt(0, 0, 500)
      }

      handleResize()
      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
        if (!forceGraph) return
        forceGraph._destructor()
      }
    }
  }, [])

  // Update the existing force graph when person state changes
  React.useEffect(() => {
    if (!forceGraph || !props.state) return
    const people = props.state.people

    const { links, nodes } = forceGraph.graphData() as {
      links: LinkObject[]
      nodes: IPersonNode[]
    }

    // This will be modified if people are added or removed
    const updatedGraphData: IForceGraphData = {
      nodes,
      links: [],
    }

    // Handle adding new people
    if (people.length > existingPeopleIds.size) {
      // Find the newly added person(s) -- they shouldn't be in the existingPeopleIds set
      const newPeople = people.filter((p) => !existingPeopleIds.has(p.id))

      // Add the new people to the existingPeopleIds set
      newPeople.forEach((p) => existingPeopleIds.add(p.id))

      // Create person nodes out of the new people. These nodes will be added to the force graph.
      const newPersonNodes = newPeople.map(createPersonNode)
      updatedGraphData.nodes = [...nodes, ...newPersonNodes]
    } else if (people.length < existingPeopleIds.size) {
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
    }

    // Re-render all links
    people.forEach(createLinksByRelationships(updatedGraphData))

    // Update the force graph!
    forceGraph.graphData(updatedGraphData)
  }, [props.state?.people])

  return <Canvas id={props.id} ref={canvasRef} style={props.style} />
}

export default React.memo(ForceGraphCanvas, (prevProps, nextProps) => {
  /* Rerender only if the "people" names, relationships, or thumbnail changed */
  const skipRerender = deepEqual(
    prevProps.state?.people.map((p) => ({
      id: p.id,
      name: p.name,
      relationships: p.relationships,
      thumbnail: p.thumbnailUrl,
    })),
    nextProps.state?.people.map((p) => ({
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
  state: ICurrentNetwork | null
}
