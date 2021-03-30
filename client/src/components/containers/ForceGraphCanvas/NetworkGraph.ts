import ForceGraph, { LinkObject, NodeObject } from "force-graph"
import {
  addPerson,
  connectPeople,
  disconnectPeople,
} from "../../../store/networks/actions"
import {
  ICurrentNetwork,
  IPerson,
  IRelationship,
  IRelationships,
} from "../../../store/networks/networkTypes"
import { store } from "../../../store/store"
import {
  setPersonInFocus,
  togglePersonOverlay,
} from "../../../store/ui/uiActions"

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

//
// Global variables
//
const CHAR_DISPLAY_LIMIT = 30
const NODE_SIZE = 12
const HIGHLIGHT_SIZE = NODE_SIZE * 1.2
const INITIAL_DISTANCE = NODE_SIZE * 2

// For highlight on hover
const highlightNodes = new Set<NodeObject>()
const highlightLinks = new Set<NodeObject>()
const hoverNode: { node: IPersonNode | null } = { node: null }

// For adding connections
const nodeToConnect: { node: IPersonNode | null } = { node: null }

// Default color if a node/its links aren't part of a group
const DEFAULT_COLOR = "black"

//
// Force Graph
//

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

  // Create the Force Graph
  const Graph = ForceGraph()(container)
    .graphData(gData)
    .nodeRelSize(NODE_SIZE)
    .nodeCanvasObject(drawPersonNode())
    .nodeLabel(() => {
      return ""
    })
    .nodeAutoColorBy("id")
    .linkDirectionalParticles(1)
    .linkDirectionalParticleWidth(1.4)
    .onLinkHover(handleLinkHover())
    .linkLabel(getLinkLabel)
    .linkCanvasObject(
      (link: LinkObject | null, ctx: CanvasRenderingContext2D) => {
        if (!link) return null

        const srcNode = link.source as NodeObject & IPersonNode
        const targetNode = link.target as NodeObject & IPersonNode

        const { x: x1, y: y1 } = srcNode
        const { x: x2, y: y2 } = targetNode
        if (!x1 || !y1 || !x2 || !y2) return null

        const centerX = (x1 + x2) / 2
        const centerY = (y1 + y2) / 2
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

        const linkColors = getLinkColors(link)

        const doHighlight = highlightLinks.has(link)
        const gradient =
          linkColors.length > 1
            ? ctx.createRadialGradient(
                centerX,
                centerY,
                0,
                centerX,
                centerY,
                distance / 3,
              )
            : null
        if (gradient) {
          linkColors.forEach((color, index) =>
            gradient.addColorStop(index / linkColors.length, color),
          )
        }

        const strokeColor = gradient ? gradient : linkColors[0]

        ctx.strokeStyle = doHighlight ? "yellow" : strokeColor
        ctx.lineWidth = doHighlight ? 1 : 0.25

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        return null
      },
    )
    .onNodeHover(
      handleNodeHover({
        container,
        gData,
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
    .dagMode("radialin")
    .dagLevelDistance(INITIAL_DISTANCE)

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
  container?: HTMLDivElement
  gData?: IForceGraphData
  nodeToConnect?: { node: IPersonNode | null }
  state?: ICurrentNetwork
}

function drawPersonNode() {
  return (node: NodeObject, ctx: CanvasRenderingContext2D) => {
    const { thumbnail, x = 0, y = 0, name, id } = node as NodeObject &
      IPersonNode
    const centerX = x / 2
    const centerY = y / 2

    // Rectangle for displaying the node's border color
    ctx.beginPath()

    // Draw a larger rectangle first that acts as a group color outline for this node
    let colors = getNodeGroupColors(node as IPersonNode)
    if (colors.length === 0)
      colors = [{ backgroundColor: DEFAULT_COLOR, textColor: DEFAULT_COLOR }]

    // Node border gradient (for the larger rectangle that will form the border by going behind the node's actual image)
    const gradient =
      colors.length > 1
        ? ctx.createLinearGradient(centerX, y, centerX, y + NODE_SIZE)
        : null
    if (gradient) {
      colors.forEach((color, index) =>
        gradient.addColorStop(index / colors.length, color.backgroundColor),
      )
    }

    const defaultNodeBorderColor = colors[0].backgroundColor
    const fillColor = gradient ? gradient : defaultNodeBorderColor

    // TODO: special effect if highlighted If this node is highlighted, make the border red
    const doHighlight = hoverNode && highlightNodes && highlightNodes.has(node)
    const isHoveredNode = node === hoverNode.node
    const hoverColor = isHoveredNode ? "red" : "orange"

    // Draw border-color rectangle
    ctx.fillStyle = doHighlight ? hoverColor : fillColor
    ctx.rect(
      x - HIGHLIGHT_SIZE / 2,
      y - HIGHLIGHT_SIZE / 2,
      HIGHLIGHT_SIZE,
      HIGHLIGHT_SIZE,
    )
    ctx.fill()

    // Draw white background (this will be overlapped by the thumbnail, if there is one)
    ctx.beginPath()
    ctx.rect(x - NODE_SIZE / 2, y - NODE_SIZE / 2, NODE_SIZE, NODE_SIZE)
    ctx.fillStyle = "white"
    ctx.fill()
    ctx.strokeStyle = "black"
    ctx.stroke()

    // Draw the thumbnail, if there is one
    if (thumbnail) {
      try {
        ctx.drawImage(
          thumbnail,
          x - NODE_SIZE / 2,
          y - NODE_SIZE / 2,
          NODE_SIZE,
          NODE_SIZE,
        )
      } catch (error) {
        // Missing image
        ctx.beginPath()
        ctx.rect(x - NODE_SIZE / 2, y - NODE_SIZE / 2, NODE_SIZE, NODE_SIZE)
        ctx.fillStyle = "red"
        ctx.fill()
        ctx.strokeStyle = "black"
        ctx.stroke()
      }
    }

    // Node Name Text
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

/**
 * @param node Person Node to get the group colors for
 * @returns array of group colors for bg and text -- [bgColor, textColor][]
 */
type GroupColors = { backgroundColor: string; textColor: string }
function getNodeGroupColors(node: IPersonNode): GroupColors[] {
  // Get the group color
  const currentNetwork = store.getState().networks.currentNetwork
  if (!currentNetwork) return []

  // Get the groups this node is part of
  const { filteredGroups } = store.getState().ui
  const groupsWithThisNode = Object.entries(
    currentNetwork.relationshipGroups,
  ).filter((entry) => {
    const [groupId, group] = entry

    // Ensure that this group is active
    //  explicitly check if the "showing" state is false since we treat "undefined" as true
    if (filteredGroups[groupId] === false) return false

    // Ensure the node is in the group
    const hasNode = group.personIds.includes(node.id)
    return hasNode
  })

  // Get the colors associated with the groups
  const colors = groupsWithThisNode.map((group) => {
    const { backgroundColor, textColor } = group[1]
    return { backgroundColor, textColor }
  })
  return colors
}

function handleLinkHover() {
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
  const doesNodeHaveRelationships = Boolean(sourceNode.relationships)
  if (!doesNodeHaveRelationships || !sourceNode.relationships[targetNode.id])
    return ""

  // Display the reason shared between the two nodes
  const relationship: IRelationship = sourceNode.relationships[targetNode.id]
  const reason = relationship.reason || ""

  return reason
}

/**
 * @param link
 * @returns Array of common group colors between the linked nodes
 */
function getLinkColors(link: LinkObject): string[] {
  const srcNode = link.source as IPersonNode
  const targetNode = link.target as IPersonNode
  if (!srcNode.relationships || !targetNode.relationships)
    return [DEFAULT_COLOR]

  // Get the group color
  const currentNetwork = store.getState().networks.currentNetwork
  if (!currentNetwork) return [DEFAULT_COLOR]

  const { filteredGroups } = store.getState().ui
  const commonGroups = Object.entries(currentNetwork.relationshipGroups).filter(
    (entry) => {
      const [groupId, group] = entry

      // Ensure that this group is active
      //  explicitly check if the "showing" state is false since we treat "undefined" as true
      if (filteredGroups[groupId] === false) return false

      // Ensure the source and target nodes are both in the group
      const hasSrcNode = group.personIds.includes(srcNode.id)
      const hasTargetNode = group.personIds.includes(targetNode.id)
      return hasSrcNode && hasTargetNode
    },
  )

  const commonColors = commonGroups.map((group) => group[1].backgroundColor)
  const colors = commonColors.length > 0 ? commonColors : [DEFAULT_COLOR]

  return colors
}

function handleNodeHover({ container, gData }: IGraphClosureData) {
  return (n: NodeObject | null) => {
    clearHighlights()

    if (container) container.style.cursor = n ? "help" : "grab"
    if (!n || !gData) return

    // Highlight the hovered node's neighbors
    highlightNode(n, gData)
  }
}

export function highlightNode(n: NodeObject, gData: IForceGraphData) {
  const node = n as NodeObject & IPersonNode

  // Clear current highlights
  hoverNode.node = node || null

  // Highlight nodes and links related to this node
  highlightNodes.add(node as NodeObject)
  node.neighbors.forEach((neighbor) => highlightNodes.add(neighbor))
  gData.links.forEach((link) => {
    if (link.source === node.id || link.target === node.id)
      highlightLinks.add(link)
  })
}

export function clearHighlights() {
  highlightNodes.clear()
  highlightLinks.clear()
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
    store.dispatch<any>(togglePersonOverlay(true))
  } catch (error) {
    console.error(error)
  }
}

function handleBackgroundRightClick({ state }: IGraphClosureData) {
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

function handleNodeRightClick({ state }: IGraphClosureData) {
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
