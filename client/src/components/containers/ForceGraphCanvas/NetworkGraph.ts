import * as d3 from "d3-force"
import ForceGraph, {
  ForceGraphInstance,
  LinkObject,
  NodeObject,
} from "force-graph"
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
const NODE_SIZE = 64
const HIGHLIGHT_SIZE = NODE_SIZE * 1.2
const INITIAL_DISTANCE = NODE_SIZE * 4

// For highlight on hover
const highlightNodes = new Set<NodeObject>()
const highlightLinkIds = new Set<string>()
const hoverNode: { node: IPersonNode | null } = { node: null }

// For adding connections
const nodeToConnect: { node: IPersonNode | null } = { node: null }

// Default color if a node/its links aren't part of a group
const DEFAULT_NODE_COLOR = "white"
const DEFAULT_TEXT_COLOR = "black"
const DEFAULT_LINK_COLOR = "black"
const LOW_ATTENTION_COLOR = "rgba(0,0,0,0.1)" // Low-opacity grey for nodes/links for non-highlighted nodes when something is being highlighted
const FONT_FAMILY = "Indie Flower, Times New Roman"
const BASE_FONT_SIZE = Math.floor(NODE_SIZE / 3)

let currentZoom = 1 // Use current zoom to scale visuals such as name tags

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
  // Create nodes from the People in the current Network
  const gData: IForceGraphData = {
    nodes: state.people.map(createPersonNode),
    links: [],
  }

  // Link people by their relationship fields
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
    .linkCanvasObject(drawLinkObject)

    .backgroundColor("#444")

  // Events
  Graph.onNodeHover(
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
    .onNodeRightClick(
      handleNodeRightClick({ nodeToConnect, state, forceGraph: Graph }),
    )
    .onZoom((transform) => {
      // Update the currentZoom variable
      currentZoom = transform.k
    })

  Graph.dagMode("radialin")
    .dagLevelDistance(INITIAL_DISTANCE)
    .d3Force(
      "collide",
      // @ts-ignore
      d3.forceCollide(Graph.nodeRelSize() * 3),
    )

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
  forceGraph?: ForceGraphInstance
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
    // Draw a larger rectangle first that acts as a group color outline for this node
    let colors = getNodeGroupColors(node as IPersonNode)
    if (colors.length === 0)
      colors = [
        { backgroundColor: DEFAULT_NODE_COLOR, textColor: DEFAULT_TEXT_COLOR },
      ]

    // Node border gradient (for the larger rectangle that will form the border by going behind the node's actual image)
    const gradient =
      colors.length > 1
        ? ctx.createLinearGradient(centerX, y, centerX, y + NODE_SIZE)
        : null
    if (gradient) {
      colors.forEach((color, index) =>
        gradient.addColorStop(
          (index + 1) / colors.length,
          color.backgroundColor,
        ),
      )
    }

    const defaultNodeBorderColor = colors[0].backgroundColor
    const fillColor = gradient ? gradient : defaultNodeBorderColor

    // Node Highlighting
    const isHighlighting = highlightNodes.size > 0 // Are there any nodes being highlighted?
    const doHighlightNode = isHighlighting && highlightNodes.has(node) // Should this node be highlighted?
    const isHoveredNode = node === hoverNode.node // Is this node is being hovered?
    const highlightColor = isHoveredNode ? "red" : "orange" // Red if hovered; other highlighted nodes are orange
    const nodeSize = isHoveredNode ? HIGHLIGHT_SIZE * 1.2 : HIGHLIGHT_SIZE // Hovered node is slightly larger

    // Show up to 30 chars of the node's name
    const text =
      name.length > CHAR_DISPLAY_LIMIT
        ? `${name.slice(0, CHAR_DISPLAY_LIMIT)}...`
        : name

    let nameTagOffset = 0

    // Draw the thumbnail-style node, if the node has a thumbnail
    if (thumbnail) {
      nameTagOffset = NODE_SIZE / 1.2

      ctx.beginPath()
      // Draw border-color rectangle
      ctx.fillStyle = "white"
      ctx.strokeStyle = "black"
      ctx.lineWidth = 1
      ctx.rect(x - nodeSize / 2, y - nodeSize / 2, nodeSize, nodeSize * 1.2)
      ctx.fill()
      ctx.stroke()
      ctx.closePath()

      // Draw white background (this will be overlapped by the thumbnail, if there is one)
      ctx.beginPath()
      ctx.rect(x - NODE_SIZE / 2, y - NODE_SIZE / 2, NODE_SIZE, NODE_SIZE)
      ctx.fillStyle = "white"
      ctx.fill()
      ctx.stroke()

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
        ctx.rect(x - NODE_SIZE / 2, y - NODE_SIZE / 2, NODE_SIZE, NODE_SIZE)
        ctx.fillStyle = "red"
        ctx.fill()
        ctx.strokeStyle = "black"
        ctx.stroke()
      }
      ctx.closePath()
    }

    // Draw a name tag for the node
    ctx.textAlign = "center"
    ctx.textBaseline = "top"

    // Scale font size based on the current zoom level
    let realFontSize = BASE_FONT_SIZE / currentZoom
    if (realFontSize < BASE_FONT_SIZE) realFontSize = BASE_FONT_SIZE // BASE_FONT_SIZE is the minimum font size

    ctx.font = `bolder ${realFontSize}px ${FONT_FAMILY}`

    // Name tag width is the text width. Minimum width equals the NODE_SIZE
    let width = ctx.measureText(text).width
    if (width < NODE_SIZE) width = NODE_SIZE

    const PADDING = 16

    const textX = x - width / 2
    const textY = y - BASE_FONT_SIZE / 2 + nameTagOffset

    ctx.beginPath()

    // Name tag color
    if (isHighlighting && doHighlightNode) {
      // Node is highlighted
      ctx.fillStyle = highlightColor
    } else if (isHighlighting && !doHighlightNode) {
      // There are highlighted nodes but this one isn't one of them
      ctx.fillStyle = LOW_ATTENTION_COLOR
    } else {
      // Normal fill color
      ctx.fillStyle = fillColor
    }

    ctx.fillRect(
      textX - PADDING / 2,
      textY - PADDING / 2,
      width + PADDING,
      realFontSize + PADDING,
    )
    ctx.lineWidth = 1

    if (isHighlighting && !doHighlightNode) {
      // There are highlighted nodes but this one isn't one of them
      ctx.strokeStyle = LOW_ATTENTION_COLOR
      ctx.fillStyle = LOW_ATTENTION_COLOR
    } else {
      // Normal fill color
      ctx.strokeStyle = "black"
      ctx.fillStyle = colors.length > 0 ? colors[0].textColor : "black"
    }

    ctx.strokeRect(
      textX - PADDING / 2,
      textY - PADDING / 2,
      width + PADDING,
      realFontSize + PADDING,
    )
    ctx.fillText(text, textX + width / 2, textY, width)
    ctx.closePath()
  }
}

function drawLinkObject(
  link: LinkObject | null,
  ctx: CanvasRenderingContext2D,
) {
  if (!link) return null

  const srcNode = link.source as NodeObject & IPersonNode
  const targetNode = link.target as NodeObject & IPersonNode

  const { x: x1, y: y1 } = srcNode
  const { x: x2, y: y2 } = targetNode
  if (!x1 || !y1 || !x2 || !y2) return null

  const centerX = (x1 + x2) / 2
  const centerY = (y1 + y2) / 2
  const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

  const linkColors = getLinkColors(link) ?? [DEFAULT_LINK_COLOR]

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
      gradient.addColorStop((index + 1) / linkColors.length, color),
    )
  }

  const isHighlighting = highlightLinkIds.size > 0 || highlightNodes.size > 0
  const doHighlightLink =
    isHighlighting &&
    highlightLinkIds.has(srcNode.id) &&
    highlightLinkIds.has(targetNode.id)

  if (doHighlightLink) {
    // Highlight this link
    ctx.strokeStyle = "yellow"
  } else if (isHighlighting) {
    // Links are being highlight but this link isn't one of them
    ctx.strokeStyle = LOW_ATTENTION_COLOR
  } else {
    // Normal link color
    ctx.strokeStyle = gradient ? gradient : linkColors[0]
  }

  const DEFAULT_LINK_SIZE = 3
  let lineWidth = doHighlightLink ? DEFAULT_LINK_SIZE * 2 : DEFAULT_LINK_SIZE
  lineWidth /= currentZoom
  if (lineWidth < DEFAULT_LINK_SIZE) lineWidth = DEFAULT_LINK_SIZE
  if (doHighlightLink && lineWidth < DEFAULT_LINK_SIZE * 2)
    lineWidth = DEFAULT_LINK_SIZE * 2

  ctx.lineWidth = lineWidth

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  return null
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
    if (!highlightLinkIds || !highlightNodes) return

    highlightNodes.clear()
    highlightLinkIds.clear()

    if (link) {
      const srcNode = link.source as NodeObject
      const targetNode = link.target as NodeObject
      if (!srcNode || !targetNode) return

      highlightNodes.add(srcNode)
      highlightNodes.add(targetNode)

      highlightLinkIds.add(srcNode.id as string)
      highlightLinkIds.add(targetNode.id as string)
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
function getLinkColors(link: LinkObject): string[] | null {
  const srcNode = link.source as IPersonNode
  const targetNode = link.target as IPersonNode
  if (!srcNode.relationships || !targetNode.relationships) return null

  // Get the group color
  const currentNetwork = store.getState().networks.currentNetwork
  if (!currentNetwork) return null

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
  const colors = commonColors.length > 0 ? commonColors : null

  return colors
}

function handleNodeHover({ container, gData }: IGraphClosureData) {
  return (n: NodeObject | null) => {
    clearHighlights()
    hoverNode.node = null

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
  highlightNodes.clear()
  highlightLinkIds.clear()

  // Highlight nodes and links related to this node
  highlightNodes.add(node as NodeObject)
  node.neighbors.forEach((neighbor) => highlightNodes.add(neighbor))
  gData.links.forEach((link) => {
    let srcId: string = ""
    let targetId: string = ""

    if (typeof link.source === "string") {
      // Link is a raw string?
      srcId = link.source as string
      targetId = link.target as string
    } else if ((link.source as object).hasOwnProperty("id")) {
      // Link is an object? Should be an IPersonNode, which has an id field
      srcId = (link.source as IPersonNode).id
      targetId = (link.target as IPersonNode).id
    } else {
      // Stop if the link is an invalid type
      return
    }

    if (srcId === node.id || targetId === node.id) {
      highlightLinkIds.add(srcId)
      highlightLinkIds.add(targetId)
    }
  })
}

export function clearHighlights() {
  highlightNodes.clear()
  highlightLinkIds.clear()
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
    // DO NOT allow right click events if in sharing mode
    if (store.getState().ui.isViewingShared) return

    // Stop if there's no state or if there's a node in the middle of being connected
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

function handleNodeRightClick({ state, forceGraph }: IGraphClosureData) {
  return async (n: NodeObject | null) => {
    // DO NOT allow right click events if in sharing mode
    if (store.getState().ui.isViewingShared) return

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
        forceGraph?.zoomToFit(500)
      } catch (error) {
        console.error(error)
      }

      // Clear the node to connect
      nodeToConnect.node = null
    }
  }
}
