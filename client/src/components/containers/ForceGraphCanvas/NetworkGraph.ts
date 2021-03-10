import ForceGraph, { LinkObject, NodeObject } from "force-graph"
import {
  addPerson,
  connectPeople,
  disconnectPeople,
} from "../../../store/networks/actions"
import {
  ICurrentNetwork,
  IPerson,
  IRelationships,
} from "../../../store/networks/networkTypes"
import { store } from "../../../store/store"
import {
  setPersonInFocus,
  togglePersonEditMenu,
} from "../../../store/ui/uiActions"

const FOCUS_TIME = 1000
const CHAR_DISPLAY_LIMIT = 30
const NODE_SIZE = 12

export interface IForceGraphData {
  nodes: IPersonNode[]
  links: LinkObject[]
}

export interface IPersonNode {
  id: string
  name: string
  thumbnail: HTMLImageElement | null
  neighbors: IPersonNode[]
  relationships: IRelationships
}

/**
 *
 * @param container
 * @param state
 * @param disconnected whether the graph is connected to Network state or not. Set to false for standalone demo graphs.
 */
export function createNetworkGraph(
  container: HTMLDivElement,
  state: ICurrentNetwork,
) {
  /* Create nodes from the People in the current Network */
  const gData: IForceGraphData = {
    nodes: state.people.map(createPersonNode),
    links: [],
  }

  /* Link people by their relationship fields */
  state.people.forEach(createLinksByRelationships(gData))

  // Set neighbors
  gData.links.forEach(setNeighbors(gData))

  // For highlight on hover
  const highlightNodes = new Set<NodeObject>()
  const highlightLinks = new Set<NodeObject>()
  const hoverNode: { node: IPersonNode | null } = { node: null }

  // For adding connections
  const nodeToConnect: { node: IPersonNode | null } = { node: null }

  // Create the Force Graph
  const Graph = ForceGraph()(container)
    .graphData(gData)
    .nodeRelSize(NODE_SIZE)
    .nodeCanvasObject(drawPersonNode({ highlightNodes, hoverNode }))
    .nodeLabel(() => {
      return ""
    })
    .nodeAutoColorBy("id")
    .linkDirectionalParticles(1)
    .linkDirectionalParticleWidth(1.4)
    .onLinkHover(handleLinkHover({ highlightLinks, highlightNodes }))
    .linkLabel(getLinkLabel)
    .linkWidth((link) => (highlightLinks.has(link) ? 5 : 1))
    .linkColor((link) => (highlightLinks.has(link) ? "yellow" : "black"))
    .onNodeHover(
      handleNodeHover({
        container,
        gData,
        highlightLinks,
        highlightNodes,
        hoverNode,
      }),
    )
    .onNodeDrag(handleNodeDrag({ container }))
    .onNodeDragEnd(handleNodeDragEnd({ container }))
    .onNodeClick(handleNodeClick)
    .onBackgroundRightClick(
      handleBackgroundRightClick({ nodeToConnect, state }),
    )
    .onNodeRightClick(handleNodeRightClick({ nodeToConnect, state }))
    .backgroundColor("#444")

  return Graph
}

//
// GRAPH DATA FUNCTIONS
//

/**
 * @param person IPerson data passed from as props from the ForceGraphCanvas component
 * @returns PersonNode for use in the Force Graph
 */
export function createPersonNode(person: IPerson): IPersonNode {
  let thumbnail: HTMLImageElement | null = null
  if (person.thumbnailUrl) {
    thumbnail = new Image()
    thumbnail.src = person.thumbnailUrl
  }

  return {
    id: person.id,
    name: person.name,
    thumbnail,
    neighbors: [],
    relationships: person.relationships,
  }
}

/**
 * Creates an array pipeline function (for use by forEach) that adds links to a graph data object by Person relationships
 * @param gData graph data to add links to
 */
export function createLinksByRelationships(gData: IForceGraphData) {
  return (person: IPerson) => {
    Object.keys(person.relationships).forEach((id) => {
      /* Ensure the other person in the relationship has a node */
      const doesOtherPersonExist = gData.nodes.some(
        (otherPerson) => otherPerson.id === id,
      )

      /* Ensure the link won't be duplicated */
      const doesLinkExist = gData.links.some(
        (link) => link.source === id && link.target === person.id,
      )
      if (!doesOtherPersonExist || doesLinkExist) return

      /* Add the link */
      gData.links.push({
        source: person.id,
        target: id,
      })
    })
  }
}

/**
 * Creates an array pipeline function (for use by forEach) that sets the neighbors of each Person node
 * @param gData graph data to use and modify
 */
export function setNeighbors(gData: IForceGraphData) {
  return (link: LinkObject) => {
    const a = gData.nodes.find((node) => node.id === link.source)
    const b = gData.nodes.find((node) => node.id === link.target)
    if (!a || !b) return

    a.neighbors.push(b)
    b.neighbors.push(a)
  }
}

//
// GRAPH RENDERING & INTERACTIVITY FUNCTIONS
//
interface IGraphClosureData {
  highlightNodes?: Set<NodeObject>
  highlightLinks?: Set<NodeObject>
  hoverNode?: { node: IPersonNode | null }
  container?: HTMLDivElement
  gData?: IForceGraphData
  nodeToConnect?: { node: IPersonNode | null }
  state?: ICurrentNetwork
}

function drawPersonNode({ highlightNodes, hoverNode }: IGraphClosureData) {
  return (node: NodeObject, ctx: CanvasRenderingContext2D) => {
    const { thumbnail, x = 0, y = 0, name } = node as NodeObject & IPersonNode

    // Highlight highlight nodes, if they exist
    if (hoverNode && highlightNodes && highlightNodes.has(node)) {
      ctx.beginPath()
      const highlightSize = NODE_SIZE * 1.2

      ctx.rect(
        x - highlightSize / 2,
        y - highlightSize / 2,
        highlightSize,
        highlightSize,
      )
      ctx.fillStyle = node === hoverNode.node ? "red" : "orange"
      ctx.fill()
    }

    if (thumbnail) {
      try {
        /* show profile pictures */
        ctx.drawImage(
          thumbnail,
          x - NODE_SIZE / 2,
          y - NODE_SIZE / 2,
          NODE_SIZE,
          NODE_SIZE,
        )
      } catch (error) {
        ctx.beginPath()
        ctx.rect(x - NODE_SIZE / 2, y - NODE_SIZE / 2, NODE_SIZE, NODE_SIZE)
        ctx.fillStyle = "red"
        ctx.fill()
        ctx.strokeStyle = "black"
        ctx.stroke()
      }
    } else {
      ctx.beginPath()
      ctx.rect(x - NODE_SIZE / 2, y - NODE_SIZE / 2, NODE_SIZE, NODE_SIZE)
      ctx.fillStyle = "white"
      ctx.fill()
      ctx.strokeStyle = "black"
      ctx.stroke()
    }

    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.fillStyle = "yellow"
    ctx.strokeStyle = "black"
    ctx.lineWidth = 0.2
    ctx.font = `${NODE_SIZE / 3}px Sans-Serif`

    // Show up to 30 chars of the node's name

    const text =
      name.length > CHAR_DISPLAY_LIMIT
        ? `${name.slice(0, CHAR_DISPLAY_LIMIT)}...`
        : name
    ctx.fillText(text, x, y + NODE_SIZE / 2)
    ctx.strokeText(text, x, y + NODE_SIZE / 2)
  }
}

function handleLinkHover({
  highlightLinks,
  highlightNodes,
}: IGraphClosureData) {
  return (link: LinkObject | null) => {
    if (!highlightLinks || !highlightNodes) return

    highlightNodes.clear()
    highlightLinks.clear()

    if (link) {
      highlightLinks.add(link)
      highlightNodes.add(link.source as NodeObject)
      highlightNodes.add(link.target as NodeObject)
    }
  }
}

function getLinkLabel(link: LinkObject | null) {
  if (!link || !link.source || !link.target) return ""

  const sourceNode = link.source as IPersonNode
  const targetNode = link.target as IPersonNode
  if (!(targetNode.id in sourceNode.relationships)) return ""

  const [rel1, rel2] = sourceNode.relationships[targetNode.id]
  return `${sourceNode.name} (${rel1}) - ${targetNode.name} (${rel2})`
}

function handleNodeHover({
  highlightNodes,
  highlightLinks,
  hoverNode,
  container,
  gData,
}: IGraphClosureData) {
  return (n: NodeObject | null) => {
    if (container) container.style.cursor = n ? "help" : "grab"
    if (!n || !gData || !hoverNode || !highlightNodes || !highlightLinks) return

    // Highlight the hovered node's neighbors
    const node = n as NodeObject & IPersonNode

    // Clear current highlights
    hoverNode.node = node || null
    highlightNodes.clear()
    highlightLinks.clear()

    // Highlight nodes and links related to this node
    highlightNodes.add(node as NodeObject)
    node.neighbors.forEach((neighbor) => highlightNodes.add(neighbor))
    gData.links.forEach((link) => {
      if (link.source === node.id || link.target === node.id)
        highlightLinks.add(link)
    })
  }
}

function handleNodeDrag({ container }: IGraphClosureData) {
  return (n: NodeObject | null) => {
    if (container) container.style.cursor = n ? "grabbing" : "grab"
  }
}

function handleNodeDragEnd({ container }: IGraphClosureData) {
  return (n: NodeObject | null) => {
    if (!n || !container) return

    /* Fix the node at it's end drag position */
    n.fx = n.x
    n.fy = n.y
    container.style.cursor = "grab"
  }
}

async function handleNodeClick(n: NodeObject | null) {
  if (!n) return
  const node = n as NodeObject & IPersonNode
  try {
    // Focus on the clicked person & show their details
    await store.dispatch<any>(setPersonInFocus(node.id))
    store.dispatch<any>(togglePersonEditMenu(true))
  } catch (error) {
    console.error(error)
  }
}

function handleBackgroundRightClick({
  nodeToConnect,
  state,
}: IGraphClosureData) {
  return async () => {
    if (!state || !nodeToConnect) return

    /* if the user is in the middle of making a node connection  */
    if (nodeToConnect.node) {
      const doCancelConnectionAction = window.confirm(
        "Cancel connection? Press OK to cancel the current connect action.",
      )
      if (doCancelConnectionAction) {
        nodeToConnect.node = null
      }
      return
    }

    try {
      const name = prompt("Add Node:")
      if (name === null) {
        alert("Canceled node creation")
        return
      }

      await store.dispatch<any>(addPerson(state.id, name))
    } catch (error) {
      console.error(error)
    }
  }
}

function handleNodeRightClick({ nodeToConnect, state }: IGraphClosureData) {
  return async (n: NodeObject | null) => {
    if (!n || !nodeToConnect || !state) return
    const node = n as NodeObject & IPersonNode

    /* Connect nodes */
    if (!nodeToConnect.node) {
      /* Picked the first node to dis(connect) */
      alert(`Link A: ${node.name}`)
      nodeToConnect.node = node as NodeObject & IPersonNode
    } else {
      /* Picked the second node to dis(connect) */
      alert(`Link B: ${node.name}`)

      // Check if the node are already connected
      const areNodesConnected = node.id in nodeToConnect.node.relationships

      // Disconnect the nodes if they are already connected
      try {
        if (areNodesConnected) {
          await store.dispatch<any>(
            disconnectPeople(state.id, {
              p1Id: nodeToConnect.node.id,
              p2Id: node.id,
            }),
          )
        } else {
          // Otherwise, connect the nodes
          await store.dispatch<any>(
            connectPeople(state.id, {
              p1Id: nodeToConnect.node.id,
              p2Id: node.id,
            }),
          )
        }
      } catch (error) {
        console.error(error)
      }

      // Clear the node to connect
      nodeToConnect.node = null
    }
  }
}
