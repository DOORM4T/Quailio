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

export interface IForceGraphData {
  nodes: (IPersonNode & NodeObject)[]
  links: LinkObject[]
}

export interface IPersonNode extends IPerson {
  thumbnail: HTMLImageElement | null
  neighbors: IPersonNode[]
  links: LinkObject[]
  isGroupNode: boolean // A group can be represented by a PersonNode
}

type NodeToConnect = {
  node: IPersonNode | null
}

//
// Global variables
//
const CHAR_DISPLAY_LIMIT = 30
const NODE_SIZE = 64
const HIGHLIGHT_SIZE = NODE_SIZE * 1.2
const INITIAL_DISTANCE = NODE_SIZE * 4
const NAMETAG_OFFSET_SCALE = 1.2
const DEFAULT_LINK_SIZE = 3

// For highlight on hover
const highlightNodes = new Set<NodeObject>()
const highlightLinks = new Set<LinkObject>()
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
 * @param currentNetwork
 * @param disconnected whether the graph is connected to Network state or not. Set to false for standalone demo graphs.
 */
export function createNetworkGraph(
  container: HTMLDivElement,
  currentNetwork: ICurrentNetwork,
) {
  // Create nodes from the People in the current Network
  const gData: IForceGraphData = {
    nodes: currentNetwork.people.map(createPersonNode),
    links: [],
  }

  // Create group nodes
  addGroupNodesToForceGraph(gData)
  addGroupNodeLinks(gData)

  // Link people by their relationship fields
  currentNetwork.people.forEach(createLinksByRelationships(gData))

  // Set neighbors and links for each node
  gData.links.forEach(setNodeNeighborsAndLinks(gData))

  // Create the Force Graph
  const Graph = ForceGraph()(container)
    .graphData(gData)
    .nodeRelSize(NODE_SIZE)
    .nodeCanvasObject((node, ctx) =>
      nodePaint(false)(node, (node as any).__indexColor, ctx),
    )
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
    .onNodeDragEnd(handleNodeDragEnd({ container, state: currentNetwork }))
    .onNodeClick(handleNodeClick)
    .onBackgroundRightClick(handleBackgroundRightClick(Graph, currentNetwork))
    .onNodeRightClick(
      handleNodeRightClick({
        nodeToConnect,
        state: currentNetwork,
        forceGraph: Graph,
      }),
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
    // @ts-ignore
    .d3Force("charge", null)
    // @ts-ignore
    // .d3Force("link", null)
    // @ts-ignore
    .d3Force("center", null)

  // @ts-ignore
  Graph.nodePointerAreaPaint(nodePaint(true))

  return Graph
}

//
// GRAPH DATA FUNCTIONS
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
// TODO: Remove this logic. Causes functions to need to check if the value exists, so might as well define custom signatures
interface IGraphClosureData {
  container?: HTMLDivElement
  forceGraph?: ForceGraphInstance
  gData?: IForceGraphData
  nodeToConnect?: { node: IPersonNode | null }
  state?: ICurrentNetwork
}

// Closure function to draw a node or its pointer collision area
const DEFAULT_NODE_COLOR_OBJECT = [
  { backgroundColor: DEFAULT_NODE_COLOR, textColor: DEFAULT_TEXT_COLOR },
]
function nodePaint(isAreaPaint: boolean) {
  return (
    node: NodeObject,
    areaColor: string,
    ctx: CanvasRenderingContext2D,
  ) => {
    const {
      thumbnail,
      x = 0,
      y = 0,
      name,
      isGroupNode,
      pinXY,
    } = node as NodeObject & IPersonNode

    let colors = getNodeGroupColors(node as IPersonNode)
    if (colors.length === 0) colors = DEFAULT_NODE_COLOR_OBJECT

    const gradient = makeGradient()
    const defaultNodeBorderColor = colors[0].backgroundColor
    const fillColor = gradient ? gradient : defaultNodeBorderColor

    const isHighlighting = highlightNodes.size > 0
    const doHighlightNode = isHighlighting && highlightNodes.has(node)
    const isHoveredNode = node === hoverNode.node
    const highlightColor = isHoveredNode ? "red" : "orange"
    const highlightSize = isHoveredNode ? HIGHLIGHT_SIZE * 1.2 : HIGHLIGHT_SIZE

    // Show up to 30 chars of the node's name
    const text =
      name.length > CHAR_DISPLAY_LIMIT
        ? `${name.slice(0, CHAR_DISPLAY_LIMIT)}...`
        : name

    drawThumbnail()
    drawNameTag()

    if (pinXY) drawPin()

    //
    // #region paintNode: HELPERS
    //

    function drawNameTag() {
      ctx.textAlign = "center"
      ctx.textBaseline = "top"

      // Scale font size based on the current zoom level
      let realFontSize = BASE_FONT_SIZE / currentZoom
      if (realFontSize < BASE_FONT_SIZE) realFontSize = BASE_FONT_SIZE // BASE_FONT_SIZE is the minimum font size

      ctx.font = `bolder ${realFontSize}px ${FONT_FAMILY}`

      // Name tag width is the text width. Minimum width equals the NODE_SIZE
      const nameTagYOffset = thumbnail ? NODE_SIZE / NAMETAG_OFFSET_SCALE : 0
      let nameTagWidth = ctx.measureText(text).width
      if (nameTagWidth < NODE_SIZE) nameTagWidth = NODE_SIZE

      const PADDING = 32

      const textX = x - nameTagWidth / 2
      const textY = y - BASE_FONT_SIZE / 2 + nameTagYOffset

      ctx.beginPath()

      // Name tag color. Group Nodes keep their color
      if (isHighlighting && doHighlightNode && !isGroupNode) {
        // Node is highlighted
        ctx.fillStyle = highlightColor
      } else if (isHighlighting && !doHighlightNode) {
        // There are highlighted nodes but this one isn't one of them
        ctx.fillStyle = LOW_ATTENTION_COLOR
      } else {
        // Normal fill color
        ctx.fillStyle = fillColor
      }

      // Group nodes get bigger name tags
      const vertNameTagPadding = isGroupNode ? PADDING * 10 : 1
      const nameTagX = textX - PADDING / 2
      const nameTagY = textY - vertNameTagPadding / 2
      const nameTagHeight = realFontSize + vertNameTagPadding

      ctx.fillRect(nameTagX, nameTagY, nameTagWidth + PADDING, nameTagHeight)

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

      ctx.strokeRect(nameTagX, nameTagY, nameTagWidth + PADDING, nameTagHeight)
      ctx.fillText(text, textX + nameTagWidth / 2, textY, nameTagWidth)
      ctx.closePath()

      if (isAreaPaint && areaColor) {
        // Paint pointer collision area (this color will not actually appear on the force graph)
        ctx.fillStyle = areaColor
        ctx.fillRect(nameTagX, nameTagY, nameTagWidth + PADDING, nameTagHeight)
      }
    }

    function drawThumbnail() {
      if (!thumbnail) return

      ctx.beginPath()

      // Draw border-color rectangle
      ctx.fillStyle = "white"
      ctx.strokeStyle = "black"
      ctx.lineWidth = 1
      ctx.rect(
        x - highlightSize / 2,
        y - highlightSize / 2,
        highlightSize,
        highlightSize * NAMETAG_OFFSET_SCALE,
      )
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
        // Draw the image (don't draw if painting area paint -- will crash)
        if (!isAreaPaint) {
          ctx.drawImage(
            thumbnail,
            x - NODE_SIZE / 2,
            y - NODE_SIZE / 2,
            NODE_SIZE,
            NODE_SIZE,
          )
        }
      } catch (error) {
        // Missing image
        ctx.rect(x - NODE_SIZE / 2, y - NODE_SIZE / 2, NODE_SIZE, NODE_SIZE)
        ctx.fillStyle = "red"
        ctx.fill()
        ctx.strokeStyle = "black"
        ctx.stroke()
      }
      ctx.closePath()

      if (isAreaPaint && areaColor) {
        // Paint pointer collision area (this color will not actually appear on the force graph)
        ctx.fillStyle = areaColor
        ctx.fillRect(
          x - highlightSize / 2,
          y - highlightSize / 2,
          highlightSize,
          highlightSize * NAMETAG_OFFSET_SCALE,
        )
      }
    }

    function drawPin() {
      ctx.beginPath()

      const pinStartOffset = thumbnail ? NODE_SIZE / 2.5 : BASE_FONT_SIZE / 4
      const pinEndOffset = thumbnail ? NODE_SIZE / 1.2 : BASE_FONT_SIZE
      ctx.moveTo(x, y - pinStartOffset)
      ctx.lineTo(x, y - pinEndOffset)

      const MIN_LINE_WIDTH = 3
      let lineWidth = MIN_LINE_WIDTH / currentZoom
      if (lineWidth < MIN_LINE_WIDTH) lineWidth = MIN_LINE_WIDTH
      ctx.lineWidth = lineWidth

      ctx.lineCap = "round"
      ctx.strokeStyle = "black"
      ctx.stroke()

      ctx.closePath()

      // Pin Circle
      const pinYOffset = thumbnail ? NODE_SIZE / 1.2 : BASE_FONT_SIZE

      const MIN_PIN_RADIUS = 5
      let pinRadius = MIN_PIN_RADIUS / currentZoom
      if (pinRadius < MIN_PIN_RADIUS) pinRadius = MIN_PIN_RADIUS

      ctx.arc(x, y - pinYOffset, pinRadius, 0, 2 * Math.PI)
      if (isAreaPaint && areaColor) ctx.fillStyle = areaColor
      else ctx.fillStyle = "red"
      ctx.fill()
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
    // #endregion paintNode: HELPERS
    //
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
  if (isGroupConnection) ctx.setLineDash([5 / currentZoom, 20 / currentZoom])

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

function handleLinkHover() {
  return (link: LinkObject | null) => {
    if (!highlightLinks || !highlightNodes) return
    if (hoverNode.node) return

    highlightNodes.clear()
    highlightLinks.clear()

    if (link) {
      const srcNode = link.source as NodeObject
      const targetNode = link.target as NodeObject
      if (!srcNode || !targetNode) return

      highlightNodes.add(srcNode)
      highlightNodes.add(targetNode)

      highlightLinks.add(link)
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
  highlightLinks.clear()

  // Highlight nodes and links related to this node
  highlightNodes.add(node as NodeObject)
  node.neighbors.forEach((neighbor) => highlightNodes.add(neighbor))
  node.links.forEach((link) => highlightLinks.add(link))
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

function handleNodeDragEnd({ container, state }: IGraphClosureData) {
  return async (n: NodeObject | null) => {
    if (!n || !container || !state) return
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

    // User is in the middle of making a node connection?
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

      await store.dispatch<any>(addPerson(currentNetwork.id, name, { x, y }))
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

    /* Connect two nodes right-clicked nodes
        Valid connections are:
          1. Person-Person
          2. Person-Group
          3. Group-Person

        Users CANNOT link two groups (Group-Group)
    */
    if (!nodeToConnect.node) {
      // Picked the first node to dis(connect) or toggle in a group
      alert(`Link A: ${node.name}`)
      nodeToConnect.node = node as NodeObject & IPersonNode
    } else {
      // Picked the second node to dis(connect) or toggle in a group

      // Group-Group connections are illegal
      if (nodeToConnect.node.isGroupNode && node.isGroupNode) return

      alert(`Link B: ${node.name}`)

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
            togglePersonInGroup(state.id, groupId, personId, !isPersonInGroup),
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
      }

      // Clear the node to connect
      nodeToConnect.node = null
    }
  }
}

export function addGroupNodesToForceGraph(gData: IForceGraphData) {
  if (!gData) return

  const relationshipGroups = store.getState().networks.currentNetwork
    ?.relationshipGroups
  if (!relationshipGroups) return

  const visibleGroups = store.getState().ui.filteredGroups

  const groupEntries = Object.entries(relationshipGroups)
  const groupsAsPersonNodes = groupEntries
    .map((entry) => {
      const [groupId, group] = entry
      const isGroupHidden = visibleGroups[groupId] === false // showing if true or undefined
      if (!isGroupHidden) return groupAsPersonNode(groupId, group)
      else return null
    })
    .filter((node) => node !== null) as IPersonNode[]

  gData.nodes = gData.nodes.concat(groupsAsPersonNodes)
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
