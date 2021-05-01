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
  pinNode,
  updateRelationshipReason,
} from "../../../store/networks/actions"
import { togglePersonInGroup } from "../../../store/networks/actions/togglePersonInGroup"
import {
  ConnectionShape,
  ICurrentNetwork,
  IPerson,
  IRelationship,
  IRelationshipGroup,
} from "../../../store/networks/networkTypes"
import { store } from "../../../store/store"
import {
  setPersonInFocus,
  togglePersonOverlay,
} from "../../../store/ui/uiActions"
import {
  IForceGraphData,
  IPersonNode,
  NodeToConnect,
  XYVals,
} from "./networkGraphTypes"

//
// Global variables
//
const CHAR_DISPLAY_LIMIT = 30
const NODE_SIZE = 64
const HIGHLIGHT_SIZE = NODE_SIZE * 1.2
const INITIAL_DISTANCE = NODE_SIZE * 4
const DEFAULT_LINK_SIZE = 3

// For highlight on hover
const highlightNodes = new Set<NodeObject>()
const highlightLinks = new Set<LinkObject>()
let hoverNodeId: string | null = null

// For adding connections
const nodeToConnect: NodeToConnect = { node: null }
let isPanningOrZooming = false
let isMouseOver = false
let isShiftDown = false
const mouseCoords: XYVals = { x: 0, y: 0 }

// Default color if a node/its links aren't part of a group
const DEFAULT_NODE_COLOR = "white"
const DEFAULT_TEXT_COLOR = "black"
const DEFAULT_LINK_COLOR = "black"
const LOW_ATTENTION_COLOR = "rgba(0,0,0,0.1)" // Low-opacity grey for nodes/links for non-highlighted nodes when something is being highlighted
const FONT_FAMILY = "Indie Flower, Times New Roman"
const BASE_FONT_SIZE = Math.floor(NODE_SIZE / 3)

// Line dash constants
const MIN_SEGMENT_LENGTH = 5
const MIN_SPACE_LENGTH = 20
const MAX_SEGMENT_LENGTH = 50
const MAX_SPACE_LENGTH = 100

let currentZoom = 1 // Use current zoom to scale visuals such as name tags

/**
 * Instantiates a network graph
 * @param container element to mount the graph on
 * @param currentNetwork data to render
 */
export function createNetworkGraph(
  container: HTMLDivElement,
  currentNetwork: ICurrentNetwork,
) {
  const gData: IForceGraphData = {
    nodes: currentNetwork.people.map(createPersonNode),
    links: [],
  }

  const createGroupNode = ([groupId, group]: [string, IRelationshipGroup]) => {
    addGroupNodeToForceGraph(gData, groupId, group)
  }
  Object.entries(currentNetwork.relationshipGroups).forEach(createGroupNode)
  gData.nodes = sortNodesBySize(gData)

  addGroupNodeLinks(gData)
  currentNetwork.people.forEach(createLinksByRelationships(gData))
  gData.links.forEach(setNodeNeighborsAndLinks(gData))

  clearCustomListeners(container)
  setCustomListeners(container)

  // Create the Force Graph
  const Graph = ForceGraph()(container)
    .graphData(gData)
    .nodeRelSize(NODE_SIZE)
    .nodeLabel(() => {
      return ""
    })
    .nodeAutoColorBy("id")
    .linkDirectionalParticles(0)
    .onLinkHover(handleLinkHover(container))
    .onLinkClick(handleLinkClick)
    .linkLabel(getLinkLabel)
    .linkCanvasObject(drawLinkObject)
    .backgroundColor("#444")

  // Events
  Graph.onNodeHover(handleNodeHover(container))
    .onNodeDrag(handleNodeDrag(container))
    .onNodeDragEnd(handleNodeDragEnd(container, currentNetwork))
    .onNodeClick(handleNodeClick)
    .onBackgroundRightClick(handleBackgroundRightClick(Graph, currentNetwork))
    .onNodeRightClick(handleNodeRightClick(Graph, currentNetwork))
    .onZoom(handleZoomPan)
    .onZoomEnd(handleZoomPanEnd)
    .minZoom(0.0001)

  // Physics
  Graph.dagMode("td")
    .dagLevelDistance(INITIAL_DISTANCE)
    .d3Force(
      "collide",
      // @ts-ignore
      d3.forceCollide(Graph.nodeRelSize() * 3),
    )
    // @ts-ignore
    .d3Force("charge", null)
    // @ts-ignore
    .d3Force("link", null)
    // @ts-ignore
    .d3Force("center", null)
    .autoPauseRedraw(false) // Keep redrawing -- or else hovering breaks

  // Pointer detection
  // @ts-ignore
  Graph.nodeCanvasObject((node, ctx) =>
    nodePaint(Graph, false)(node, (node as any).__indexColor, ctx),
  ).nodePointerAreaPaint(nodePaint(Graph, true))

  return Graph
}

//
// #region HELPER FUNCTIONS
//

/**
 * @param person IPerson data passed from as props from the ForceGraphCanvas component
 * @returns PersonNode for use in the Force Graph
 */
export function createPersonNode(person: IPerson): IPersonNode & NodeObject {
  let thumbnail: HTMLImageElement | null = null
  if (person.thumbnailUrl) {
    thumbnail = new Image()
    thumbnail.src = person.thumbnailUrl
  }

  return {
    ...person,
    thumbnail,
    neighbors: [],
    links: [],
    isGroupNode: false,
    isBackground: person.isBackground || false, // If this is undefined, the node isn't a background node
  }
}

/**
 * @param group
 * @returns the group as a Person Node
 */
export function groupAsPersonNode(
  groupId: string,
  group: IRelationshipGroup,
): IPersonNode & NodeObject {
  return {
    id: groupId,
    name: group.name,
    thumbnail: null,
    neighbors: [],
    links: [],
    relationships: {},
    isGroupNode: true,
    isBackground: false,

    // Pin position (if the node has a pinXY property)
    pinXY: group.pinXY,
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
export function setNodeNeighborsAndLinks(gData: IForceGraphData) {
  return (link: LinkObject) => {
    const a = gData.nodes.find((node) => node.id === link.source)
    const b = gData.nodes.find((node) => node.id === link.target)
    if (!a || !b) return

    // Each node will track their neighbors
    a.neighbors.push(b)
    b.neighbors.push(a)

    // They'll track their links too
    a.links.push(link)
    b.links.push(link)
  }
}

//
// GRAPH RENDERING & INTERACTIVITY FUNCTIONS
//

// Closure function to draw a node or its pointer collision area
const DEFAULT_NODE_COLOR_OBJECT = [
  { backgroundColor: DEFAULT_NODE_COLOR, textColor: DEFAULT_TEXT_COLOR },
]

function nodePaint(graph: ForceGraphInstance, isAreaPaint: boolean) {
  return (n: NodeObject, areaColor: string, ctx: CanvasRenderingContext2D) => {
    if (!n) return

    const node = n as NodeObject & IPersonNode
    const { thumbnail, name, isGroupNode, id, scaleXY, x = 0, y = 0 } = node
    const { x: xScale, y: yScale } = scaleXY || { x: 1, y: 1 }
    const doPointerDetection = isAreaPaint && node.isBackground === false // Explicitly check for false since true and undefined mean a node IS NOT a background node

    const isConnecting = id === nodeToConnect.node?.id
    if (isConnecting && isMouseOver && !isPanningOrZooming && !isAreaPaint)
      drawLineToMouse(ctx, x, y)

    let colors = getNodeGroupColors(node as IPersonNode)
    if (colors.length === 0) colors = DEFAULT_NODE_COLOR_OBJECT

    const gradient = makeGradient()
    const defaultNodeBorderColor = colors[0].backgroundColor
    const fillColor = gradient ? gradient : defaultNodeBorderColor

    const isHighlighting = highlightNodes.size > 0
    const doHighlightNode = isHighlighting && highlightNodes.has(node)
    const isHoveredNode = node.id === hoverNodeId
    const highlightColor = isHoveredNode ? "red" : "orange"

    // Show up to 30 chars of the node's name
    const text =
      name.length > CHAR_DISPLAY_LIMIT
        ? `${name.slice(0, CHAR_DISPLAY_LIMIT)}...`
        : name

    drawThumbnail()
    drawNameTag()

    //
    // #region nodePaint: HELPERS
    //

    function drawNameTag() {
      // Name tag color. Group Nodes keep their color
      // Show only highlighted node if SHIFT key is down
      if (isShiftDown && isHighlighting && doHighlightNode && !isGroupNode) {
        // Node is highlighted
        ctx.fillStyle = highlightColor
      } else if (isShiftDown && isHighlighting && !doHighlightNode) {
        // There are highlighted nodes but this one isn't one of them
        ctx.fillStyle = LOW_ATTENTION_COLOR
      } else {
        // Normal fill color
        ctx.fillStyle = fillColor
      }

      ctx.textAlign = "center"
      ctx.textBaseline = "top"

      // Scale font size based on the current zoom level
      let realFontSize = BASE_FONT_SIZE * yScale
      if (yScale === 1) realFontSize /= currentZoom
      if (realFontSize < BASE_FONT_SIZE) realFontSize = BASE_FONT_SIZE // BASE_FONT_SIZE is the minimum font size
      ctx.font = `bolder ${realFontSize}px ${FONT_FAMILY}`

      // Name tag width is the text width. Minimum width equals the NODE_SIZE
      const nameTagYOffset = thumbnail ? (NODE_SIZE * yScale) / 2 : 0
      const PADDING = 32
      let nameTagWidth = ctx.measureText(text).width + PADDING
      if (nameTagWidth < NODE_SIZE) nameTagWidth = NODE_SIZE
      const nameTagHeight = realFontSize

      const textX = x - nameTagWidth / 2
      const textY = y + nameTagYOffset

      ctx.fillRect(textX, textY, nameTagWidth, nameTagHeight)

      ctx.lineWidth = 1
      if (isShiftDown && isHighlighting && !doHighlightNode) {
        // There are highlighted nodes but this one isn't one of them
        ctx.strokeStyle = LOW_ATTENTION_COLOR
        ctx.fillStyle = LOW_ATTENTION_COLOR
      } else {
        // Normal fill color
        ctx.strokeStyle = "black"
        ctx.fillStyle = colors.length > 0 ? colors[0].textColor : "black"
      }

      ctx.beginPath()
      // Custom group name tag styles
      // These are hidden when something is highlighted by this group isn't one of them + SHIFT is down
      if (isGroupNode) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
        ctx.lineWidth = 2 / currentZoom
      }
      ctx.strokeRect(textX, textY, nameTagWidth, nameTagHeight)
      ctx.fillText(text, textX + nameTagWidth / 2, textY, nameTagWidth)
      ctx.closePath()

      if (doPointerDetection) {
        // Paint pointer collision area (this color will not actually appear on the force graph)
        ctx.fillStyle = areaColor
        ctx.fillRect(textX, textY, nameTagWidth, nameTagHeight)
      }
    }

    function drawThumbnail() {
      if (!thumbnail) return

      ctx.beginPath()

      const width = NODE_SIZE * xScale
      const height = NODE_SIZE * yScale

      try {
        // Draw the image (don't draw if painting area paint -- will crash)
        if (!isAreaPaint) {
          // Hide the thumbnail if node are being highlighted and this node isn't one of them
          if (isShiftDown && isHighlighting && !doHighlightNode) return
          ctx.drawImage(thumbnail, x - width / 2, y - height / 2, width, height)
        }
      } catch (error) {
        // Missing image
        ctx.rect(x - width / 2, y - height / 2, width, height)
        ctx.fillStyle = "red"
        ctx.fill()
      }

      if (doPointerDetection) {
        // Paint pointer collision area (this color will not actually appear on the force graph)
        ctx.fillStyle = areaColor
        ctx.fillRect(x - width / 2, y - height / 2, width, height)
      }
    }

    function makeGradient() {
      if (colors.length === 1) return null

      const colorGradient = ctx.createLinearGradient(x, y, x, y + NODE_SIZE)

      if (colorGradient) {
        colors.forEach((color, index) =>
          colorGradient.addColorStop(
            (index + 1) / colors.length,
            color.backgroundColor,
          ),
        )
      }

      return colorGradient
    }

    //
    // #endregion nodePaint: HELPERS
    //
  }

  function drawLineToMouse(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
  ) {
    const { x: mouseX, y: mouseY } = graph.screen2GraphCoords(
      mouseCoords.x,
      mouseCoords.y,
    )

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(mouseX, mouseY)
    ctx.lineWidth = DEFAULT_LINK_SIZE / currentZoom
    ctx.strokeStyle = "black"
    ctx.stroke()
    ctx.closePath()
  }
}

function drawLinkObject(
  link: LinkObject | null,
  ctx: CanvasRenderingContext2D,
) {
  if (!link || !link.source || !link.target) return null

  const srcNode = link.source as NodeObject & IPersonNode
  const targetNode = link.target as NodeObject & IPersonNode

  const { x: x1, y: y1, relationships: srcRels, id: srcId } = srcNode
  const { x: x2, y: y2, relationships: targetRels, id: targetId } = targetNode
  if (!x1 || !y1 || !x2 || !y2) return null

  const isGroupConnection = srcNode.isGroupNode || targetNode.isGroupNode

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

  const isHighlighting = highlightLinks.size > 0 || highlightNodes.size > 0
  const doHighlightLink = isHighlighting && highlightLinks.has(link)

  ctx.setLineDash([])
  if (isGroupConnection) dashLine(ctx)

  if (doHighlightLink) {
    ctx.strokeStyle = "yellow"
  } else if (isHighlighting) {
    // Links are being highlight but this link isn't one of them
    ctx.strokeStyle = LOW_ATTENTION_COLOR
  } else if (isGroupConnection) {
    ctx.strokeStyle = "rgba(0,0,0,0.2)"
  } else {
    ctx.strokeStyle = gradient ? gradient : linkColors[0]
  }

  let lineWidth = doHighlightLink ? DEFAULT_LINK_SIZE * 2 : DEFAULT_LINK_SIZE
  lineWidth /= currentZoom
  if (lineWidth < DEFAULT_LINK_SIZE) lineWidth = DEFAULT_LINK_SIZE
  if (doHighlightLink && lineWidth < DEFAULT_LINK_SIZE * 2)
    lineWidth = DEFAULT_LINK_SIZE * 2
  ctx.lineWidth = lineWidth

  // Draw the relationship line
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.closePath()

  // Draw the line ending shape (if there is one)
  // e.g. srcNode's shape is "arrow" in its relationship with target node? Draw an arrow at targetNode's end of the link line
  const shapeAtTarget = srcRels[targetId]?.shape
  const shapeAtSrc = targetRels[srcId]?.shape
  if (shapeAtTarget && shapeAtTarget !== "none")
    drawLineEndShape(shapeAtTarget, "target")
  if (shapeAtSrc && shapeAtSrc !== "none")
    drawLineEndShape(shapeAtSrc, "source")

  //
  // #region drawLinkObject: HELPERS
  //

  function drawLineEndShape(shape: ConnectionShape, at: "target" | "source") {
    if (!x1 || !x2 || !y1 || !y2) return
    const toX = at === "target" ? x2 : x1
    const toY = at === "target" ? y2 : y1
    const fromX = at === "target" ? x1 : x2
    const fromY = at === "target" ? y1 : y2

    switch (shape) {
      case "arrow": {
        drawArrow()
        break
      }
    }

    function drawArrow() {
      const MIN_HEAD_LENGTH = 20
      let headLen = MIN_HEAD_LENGTH / currentZoom
      if (headLen < MIN_HEAD_LENGTH) headLen = MIN_HEAD_LENGTH

      const ANGLE_OFFSET = Math.PI / 4

      const dx = toX - fromX
      const dy = toY - fromY
      const angle = Math.atan2(dy, dx)

      const offsetAngle = (angle + Math.PI) % (2 * Math.PI)
      const headAngle1 = offsetAngle - ANGLE_OFFSET
      const headAngle2 = offsetAngle + ANGLE_OFFSET

      const cx = (toX + fromX) / 2
      const cy = (toY + fromY) / 2

      const head1X = cx + headLen * Math.cos(headAngle1)
      const head1Y = cy + headLen * Math.sin(headAngle1)
      const head2X = cx + headLen * Math.cos(headAngle2)
      const head2Y = cy + headLen * Math.sin(headAngle2)

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(head1X, head1Y)
      ctx.moveTo(cx, cy)
      ctx.lineTo(head2X, head2Y)

      ctx.lineCap = "square"
      ctx.stroke()
      ctx.closePath()
    }
  }

  //
  // #endregion drawLinkObject: HELPERS
  //
}

function dashLine(ctx: CanvasRenderingContext2D) {
  let segment = MIN_SEGMENT_LENGTH / currentZoom
  let space = MIN_SPACE_LENGTH / currentZoom
  if (segment < MIN_SEGMENT_LENGTH) segment = MIN_SEGMENT_LENGTH
  if (segment > MAX_SEGMENT_LENGTH) segment = MAX_SEGMENT_LENGTH

  if (space < MIN_SPACE_LENGTH) space = MIN_SPACE_LENGTH
  if (space > MAX_SPACE_LENGTH) space = MAX_SPACE_LENGTH

  ctx.lineCap = "square"
  ctx.setLineDash([segment, space])
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

  // The PersonNode represents a group, instead of an actual person node?
  if (node.isGroupNode && currentNetwork.relationshipGroups[node.id]) {
    const { backgroundColor, textColor } = currentNetwork.relationshipGroups[
      node.id
    ]
    return [{ backgroundColor, textColor }]
  }

  // The node represents an actual IPerson. Get the groups this node is part of
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

function handleLinkHover(container: HTMLDivElement) {
  return (link: LinkObject | null) => {
    clearHighlights()
    container.style.cursor = link ? "pointer" : "grab"
    if (!link || hoverNodeId) return

    const srcNode = link.source as NodeObject
    const targetNode = link.target as NodeObject
    if (!srcNode || !targetNode) return

    highlightNodes.add(srcNode)
    highlightNodes.add(targetNode)
    highlightLinks.add(link)
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

function handleNodeHover(container: HTMLDivElement) {
  return (n: NodeObject | null) => {
    clearHighlights()
    container.style.cursor = n ? "pointer" : "grab"

    if (!n) return
    highlightNode(n)
  }
}

export function highlightNode(n: NodeObject) {
  const node = n as NodeObject & IPersonNode
  hoverNodeId = node.id

  // Highlight nodes and links related to this node
  highlightNodes.add(node as NodeObject)
  node.neighbors.forEach((neighbor) => highlightNodes.add(neighbor))
  node.links.forEach((link) => highlightLinks.add(link))
}

export function clearHighlights() {
  hoverNodeId = null
  highlightNodes.clear()
  highlightLinks.clear()
}

function handleNodeDrag(container: HTMLDivElement) {
  return (n: NodeObject | null) => {
    container.style.cursor = n ? "grabbing" : "grab"
  }
}

function handleNodeDragEnd(container: HTMLDivElement, state: ICurrentNetwork) {
  return async (n: NodeObject | null) => {
    if (!n) return
    const node = n as IPersonNode & NodeObject

    // Fix the node at it's end drag position
    n.fx = n.x
    n.fy = n.y

    // Update the person's pinXY in global state using a custom Redux action
    if (n.fx && n.fy) {
      try {
        await store.dispatch<any>(
          pinNode(state.id, node.id, node.isGroupNode, { x: n.fx, y: n.fy }),
        )
      } catch (error) {
        console.error(error)
      }
    }

    container.style.cursor = "grab"
  }
}

async function handleNodeClick(n: NodeObject | null) {
  if (!n) return
  const node = n as NodeObject & IPersonNode

  // TODO: Clicking a group node does nothing... for now
  if (node.isGroupNode) return

  try {
    // Focus on the clicked person & show their details
    await store.dispatch<any>(setPersonInFocus(node.id))
    store.dispatch<any>(togglePersonOverlay(true))
  } catch (error) {
    console.error(error)
  }
}

function handleBackgroundRightClick(
  graph: ForceGraphInstance,
  currentNetwork: ICurrentNetwork,
) {
  return async (e: MouseEvent) => {
    const { x, y } = graph.screen2GraphCoords(e.offsetX, e.offsetY)

    // DO NOT allow right click events if in sharing mode
    if (store.getState().ui.isViewingShared) return

    // Cancel connection-making action
    if (nodeToConnect.node) {
      nodeToConnect.node = null
      return
    }

    try {
      const name = prompt("Add Node:")
      if (name === null) {
        alert("Canceled node creation")
        return
      }

      await store.dispatch<any>(addPerson(currentNetwork.id, name, { x, y }))
    } catch (error) {
      console.error(error)
    }
  }
}

function handleNodeRightClick(
  graph: ForceGraphInstance,
  currentNetwork: ICurrentNetwork,
) {
  return async (n: NodeObject | null) => {
    // DO NOT allow right click events if in sharing mode
    if (store.getState().ui.isViewingShared) return

    if (!n || !nodeToConnect) return
    const node = n as NodeObject & IPersonNode

    /* Connect two nodes right-clicked nodes
        Valid connections are:
          1. Person-Person
          2. Person-Group
          3. Group-Person

        Users CANNOT link two groups (Group-Group)
        Users CANNOT link a node to itself
    */
    if (!nodeToConnect.node) {
      // Picked the first node to dis(connect) or toggle in a group
      nodeToConnect.node = node as NodeObject & IPersonNode
    } else {
      // Picked the second node to dis(connect) or toggle in a group

      // Group-Group connections are illegal
      if (nodeToConnect.node.isGroupNode && node.isGroupNode) return

      // Self-Self connections are illegal
      if (nodeToConnect.node.id === node.id) return

      const isOnlyFirstNodeAGroup =
        nodeToConnect.node.isGroupNode && !node.isGroupNode
      const isOnlySecondNodeAGroup =
        !nodeToConnect.node.isGroupNode && node.isGroupNode
      const isOneAGroup = isOnlyFirstNodeAGroup || isOnlySecondNodeAGroup

      if (isOneAGroup) {
        // One of the nodes is a group; add/remove it to/from the group
        const groupId = isOnlyFirstNodeAGroup ? nodeToConnect.node.id : node.id
        const personId = isOnlyFirstNodeAGroup ? node.id : nodeToConnect.node.id
        const group = store.getState().networks.currentNetwork
          ?.relationshipGroups[groupId]

        try {
          if (!group) throw new Error("That group doesn't exist")

          const isPersonInGroup = group.personIds.includes(personId)

          await store.dispatch<any>(
            togglePersonInGroup(
              currentNetwork.id,
              groupId,
              personId,
              !isPersonInGroup,
            ),
          )
        } catch (error) {
          console.error(error)
        }
      } else {
        // Otherwise, make each node add each other to their relationships field

        // Check if the node are already connected
        const areNodesConnected = node.id in nodeToConnect.node.relationships

        // Disconnect the nodes if they are already connected
        try {
          if (areNodesConnected) {
            await store.dispatch<any>(
              disconnectPeople(currentNetwork.id, {
                p1Id: nodeToConnect.node.id,
                p2Id: node.id,
              }),
            )
          } else {
            // Otherwise, connect the nodes
            await store.dispatch<any>(
              connectPeople(currentNetwork.id, {
                p1Id: nodeToConnect.node.id,
                p2Id: node.id,
              }),
            )
          }
        } catch (error) {
          console.error(error)
        }
      }

      // Clear the node to connect
      // Can keep making connections to the first node if SHIFT is down
      if (isShiftDown) {
        const updatedNode = graph
          .graphData()
          .nodes.find((gNode) => gNode.id === nodeToConnect.node?.id)
        nodeToConnect.node = (updatedNode as IPersonNode) || null
        return
      }
      nodeToConnect.node = null
    }
  }
}

export function addGroupNodeToForceGraph(
  gData: IForceGraphData,
  groupId: string,
  group: IRelationshipGroup,
) {
  if (!gData) return

  const visibleGroups = store.getState().ui.filteredGroups
  // Hidden if explicitly false. undefined/true indicate the group is visible
  if (visibleGroups[groupId] === false) return

  const node = groupAsPersonNode(groupId, group)
  gData.nodes = gData.nodes.concat(node)
}

export function addGroupNodeLinks(gData: IForceGraphData) {
  if (!gData) return

  const groupNodes = gData.nodes.filter((node) => node.isGroupNode)

  const relationshipGroups = store.getState().networks.currentNetwork
    ?.relationshipGroups
  if (!relationshipGroups) return

  groupNodes.forEach((groupNode) => {
    const group = relationshipGroups[groupNode.id]
    if (!group) return

    group.personIds.forEach((personId) => {
      //  Ensure the person has a node in the force graph
      const doesOtherPersonExist = gData.nodes.some(
        (node) => node.id === personId,
      )
      if (!doesOtherPersonExist) return

      gData.links.push({
        source: groupNode.id,
        target: personId,
      })
    })
  })
}

function updateMouseCoords(e: MouseEvent) {
  if (!nodeToConnect.node) return
  setMouseCoords(e)
}

function setMouseOver(e: MouseEvent) {
  if (isMouseOver) return
  isMouseOver = true
}

function setMouseOut(e: MouseEvent) {
  if (!isMouseOver) return
  isMouseOver = false
}

function setMouseCoords(e: MouseEvent) {
  mouseCoords.x = e.offsetX
  mouseCoords.y = e.offsetY
}

function setShiftDown(e: KeyboardEvent) {
  if (isShiftDown === e.shiftKey) return

  isShiftDown = e.shiftKey
}

export function clearCustomListeners(container: HTMLElement) {
  container.removeEventListener("mousemove", updateMouseCoords)
  container.removeEventListener("mouseup", setMouseCoords)

  container.removeEventListener("mouseenter", setMouseOver)
  container.removeEventListener("mouseleave", setMouseOut)

  window.removeEventListener("keydown", setShiftDown)
  window.removeEventListener("keyup", setShiftDown)
}

function setCustomListeners(container: HTMLElement) {
  container.addEventListener("mousemove", updateMouseCoords)
  container.addEventListener("mouseup", setMouseCoords)

  container.addEventListener("mouseenter", setMouseOver)
  container.addEventListener("mouseleave", setMouseOut)

  window.addEventListener("keydown", setShiftDown)
  window.addEventListener("keyup", setShiftDown)
}

function handleZoomPan(transform: { k: number; x: number; y: number }) {
  // Update the currentZoom variable
  currentZoom = transform.k

  if (isPanningOrZooming) return
  isPanningOrZooming = true
}

function handleZoomPanEnd(transform: { k: number; x: number; y: number }) {
  if (!isPanningOrZooming) return
  isPanningOrZooming = false
}

async function handleLinkClick(link: LinkObject) {
  // DO NOT allow right click events if in sharing mode
  if (store.getState().ui.isViewingShared) return

  const srcNode = link.source as IPersonNode | undefined
  const targetNode = link.target as IPersonNode | undefined
  if (!srcNode || !targetNode) return
  if (srcNode.isGroupNode || targetNode.isGroupNode) return

  const relationship = srcNode.relationships[targetNode.id]
  if (!relationship) return

  const updatedReason = prompt("Edit relationship: ", relationship.reason)
  const didCancel = updatedReason === null
  if (didCancel) return

  try {
    await store.dispatch<any>(
      updateRelationshipReason(
        srcNode.id,
        targetNode.id,
        updatedReason as string,
      ),
    )
    highlightLinks.clear()
    highlightNodes.clear()
  } catch (error) {
    console.error(error)
  }
}

// Bigger nodes will render first, with smallern nodes appearing on top of them
export function sortNodesBySize(gData: IForceGraphData) {
  return gData.nodes.sort((a, b) => {
    const sizeA = a.scaleXY ? a.scaleXY.x * a.scaleXY.y : 1
    const sizeB = b.scaleXY ? b.scaleXY.x * b.scaleXY.y : 1
    return sizeB - sizeA
  })
}

// #endregion HELPER FUNCTIONS
