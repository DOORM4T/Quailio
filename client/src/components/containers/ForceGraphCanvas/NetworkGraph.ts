import * as d3 from "d3-force"
import ForceGraph, {
  ForceGraphInstance,
  LinkObject,
  NodeObject,
} from "force-graph"
import {
  addPerson,
  connectPeople,
  deletePerson,
  disconnectPeople,
  pinMultipleNodes,
  updateRelationshipReason,
} from "../../../store/networks/actions"
import { duplicateNodes } from "../../../store/networks/actions/duplicateNodes"
import { setHideNameTag } from "../../../store/networks/actions/setHideNameTag"
import {
  ConnectionShape,
  ICurrentNetwork,
  IPerson,
  IRelationship,
} from "../../../store/networks/networkTypes"
import { store } from "../../../store/store"
import {
  selectNodes,
  setPathOverlayContent,
  setPersonInFocus,
  setToolbarAction,
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
const NODE_SIZE = 64
const INITIAL_DISTANCE = NODE_SIZE * 4
const DEFAULT_LINK_SIZE = 1.5

const highlightNodes = new Set<NodeObject>()
const highlightLinks = new Set<LinkObject>()
let hoverNodeId: string | null = null

// For adding connections
const nodeToConnect: NodeToConnect = { node: null }
let isPanningOrZooming = false
let isMouseOver = false
const mouseCoords: XYVals = { x: 0, y: 0 }

// Default color if a node/its links aren't part of a group
const DEFAULT_NODE_COLOR = "white"
const DEFAULT_LINK_COLOR = "black"
const DEFAULT_TEXT_COLOR = "black"
const LOW_ATTENTION_COLOR = "rgba(0,0,0,0.1)" // Low-opacity grey for nodes/links for non-highlighted nodes when something is being highlighted
const FONT_FAMILY = "Indie Flower, Times New Roman"
const BASE_FONT_SIZE = Math.floor(NODE_SIZE / 3)
const MAX_FONT_SIZE = BASE_FONT_SIZE * 10
const BADGE_FONT_SIZE = BASE_FONT_SIZE / 1.5

let currentZoom = 1 // Use current zoom to scale visuals such as name tags
let isBoxSelecting = false // Tracks whether the user is box selecting nodes or not

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

  currentNetwork.people.forEach(createLinksByRelationships(gData))
  gData.links.forEach(setNodeNeighborsAndLinks(gData))

  // Create the Force Graph
  const Graph = ForceGraph()(container)
    .graphData(gData)
    .nodeRelSize(NODE_SIZE)
    .nodeLabel(() => {
      return ""
    })
    .linkDirectionalParticles(0)
    .onLinkHover(handleLinkHover(container))
    .onLinkClick(handleLinkClick)
    .linkLabel(getLinkLabel)
    .linkCanvasObject(drawLinkObject)
    .backgroundColor("#444")

  // Events
  Graph.onNodeHover(handleNodeHover(container))
    .onNodeDrag(handleNodeDrag(container, Graph))
    .onNodeDragEnd(handleNodeDragEnd(container, currentNetwork, Graph))
    .onNodeClick(handleNodeClick(Graph))
    .onBackgroundClick(handleBackgroundClick(Graph, currentNetwork))
    .onZoom(handleZoomPan)
    .onZoomEnd(handleZoomPanEnd)
    .minZoom(0.001)
    .maxZoom(300)

  // Physics
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
    .d3Force("link", null)
    // @ts-ignore
    .d3Force("center", null)
    .autoPauseRedraw(false) // Keep redrawing -- or else hovering breaks

  // Pointer detection
  // @ts-ignore
  Graph.onRenderFramePre(drawBackgroundNodes(Graph))
    .nodeCanvasObject(drawNodeNormally(Graph))
    .nodePointerAreaPaint(nodePaint(Graph, true))
    .enablePointerInteraction(true)
    .enableNodeDrag(false)

  // Immediately sorting nodes causes some large background nodes to overlap smaller backgorund nodes
  // -- possibly because of image load times?
  // Sorting after 1 second works though
  setTimeout(() => {
    sortNodesBySize(Graph.graphData() as IForceGraphData)
  }, 1000)

  return Graph
}

function drawBackgroundNodes(Graph: ForceGraphInstance) {
  return (ctx: CanvasRenderingContext2D) => {
    Graph.graphData().nodes.forEach((n) => {
      if (!(n as IPersonNode).isBackground) return
      nodePaint(Graph, false)(n, "", ctx)
    })
  }
}

function drawNodeNormally(Graph: ForceGraphInstance) {
  return (node: NodeObject, ctx: CanvasRenderingContext2D) => {
    if ((node as IPersonNode).isBackground) return // Do not render background nodes here. They are rendered before normal node rendering.
    const areaPaintColor = (node as any).__indexColor // Unique  color used for pointer detection. This color does not actually show.
    nodePaint(Graph, false)(node, areaPaintColor, ctx)
  }
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
function nodePaint(graph: ForceGraphInstance, isAreaPaint: boolean) {
  return (n: NodeObject, areaColor: string, ctx: CanvasRenderingContext2D) => {
    if (!n) return

    const node = n as NodeObject & IPersonNode
    const {
      thumbnail,
      name,
      id,
      scaleXY,
      x = 0,
      y = 0,
      isBackground,
      isGroup,
      backgroundColor = DEFAULT_NODE_COLOR,
      textColor = DEFAULT_TEXT_COLOR,
    } = node
    const { x: xScale, y: yScale } = scaleXY || { x: 1, y: 1 }
    const doPointerDetection = isAreaPaint && isBackground !== true // Explicitly check for true since false and undefined mean a node IS NOT a background node

    if (isGroup && store.getState().ui.personNodeVisibility[id] === false)
      return // Skip render if the node is a group and is hidden. true and undefined mean it's visible.

    const isConnecting = id === nodeToConnect.node?.id
    if (isConnecting && isMouseOver && !isPanningOrZooming && !isAreaPaint)
      drawLineToMouse(ctx, x, y)

    const isHighlighting = highlightNodes.size > 0
    const doHighlightNode = isHighlighting && highlightNodes.has(node)
    const isHoveredNode = node.id === hoverNodeId
    const highlightColor = isHoveredNode ? "red" : "orange"

    const { selectedNodeIds, isSmallMode } = store.getState().ui
    const isSelected = selectedNodeIds.includes(id)
    if (isSmallMode && !isBackground) {
      drawSmallNode()
      return
    }

    const { height: thumbnailHeight } = drawThumbnail()

    if (
      (node.thumbnail && node.doHideNameTag) ||
      (isSmallMode && !isBackground)
    )
      return
    const { nameTagWidth: ntWidth, nameTagHeight: ntHeight } = drawNameTag()

    // Draw group badges
    let badgeXOffset = -ntWidth / 2
    let badgeYOffset = thumbnailHeight / 2 + ntHeight
    const groupIds = store.getState().ui.activeGroupsByPersonId[node.id]
    if (!groupIds) return
    if (isHighlighting && !doHighlightNode) return
    groupIds.forEach(drawGroupBadge)

    //
    // #region nodePaint: HELPERS
    //

    function drawSmallNode() {
      ctx.beginPath()
      const largerScale = xScale > yScale ? xScale : yScale
      const radius = 5 * largerScale
      ctx.arc(x, y, radius, 0, 2 * Math.PI)

      if (doPointerDetection) {
        ctx.fillStyle = areaColor
      } else if (isHighlighting && !doHighlightNode) {
        ctx.fillStyle = LOW_ATTENTION_COLOR
        ctx.strokeStyle = LOW_ATTENTION_COLOR
      } else if (doHighlightNode || isSelected) {
        ctx.fillStyle = highlightColor
        ctx.strokeStyle = highlightColor
      } else {
        ctx.fillStyle = DEFAULT_NODE_COLOR
      }
      ctx.fill()
      ctx.strokeStyle = "black"
      ctx.stroke()

      if (isHighlighting && !doHighlightNode) {
        ctx.closePath()
        return
      }

      let realFontSize = BASE_FONT_SIZE / currentZoom / 1.5
      if (realFontSize > BASE_FONT_SIZE * 6) realFontSize = BASE_FONT_SIZE * 6
      ctx.font = `${realFontSize}px ${FONT_FAMILY}`
      ctx.fillText(name, x, y + radius)
      ctx.strokeStyle = "white"
      ctx.lineWidth = 0.5
      ctx.strokeText(name, x, y + radius)

      if (isGroup) {
        ctx.font = `${radius}px ${FONT_FAMILY} bolder`
        ctx.fillStyle = "black"
        ctx.fillText("G", x, y - radius / 2)
      }
      ctx.closePath()
    }

    function drawGroupBadge(groupId: string) {
      ctx.font = `${BADGE_FONT_SIZE}px ${FONT_FAMILY}`

      const group = store
        .getState()
        .networks.currentNetwork?.people.find(
          (p) => p.isGroup && p.id === groupId,
        )
      if (!group) return
      const {
        name: groupName,
        backgroundColor: badgeColor,
        textColor: badgeTextColor,
      } = group
      const badgeWidth = ctx.measureText(`  ${groupName}  `).width

      ctx.fillStyle = badgeColor || "white"
      ctx.fillRect(
        x + badgeXOffset,
        y + badgeYOffset,
        badgeWidth,
        BADGE_FONT_SIZE,
      )

      ctx.strokeStyle = "black"
      ctx.lineWidth = 1
      ctx.strokeRect(
        x + badgeXOffset,
        y + badgeYOffset,
        badgeWidth,
        BADGE_FONT_SIZE,
      )

      ctx.fillStyle = badgeTextColor || "black"
      ctx.fillText(
        groupName,
        x + badgeXOffset + badgeWidth / 2,
        y + badgeYOffset,
      )

      badgeXOffset += badgeWidth
      if (badgeXOffset + ntWidth / 2 + badgeWidth < ntWidth) return
      badgeYOffset += BADGE_FONT_SIZE
      badgeXOffset = -ntWidth / 2
    }

    function drawNameTag() {
      const doHighlightNameTag = isHighlighting && doHighlightNode
      // Name tag color. Group Nodes keep their color
      if (isHighlighting && !doHighlightNode) {
        // There are highlighted nodes but this one isn't one of them
        ctx.fillStyle = LOW_ATTENTION_COLOR
      } else if (doHighlightNameTag || isSelected) {
        // This node is highlighted or selected
        ctx.fillStyle = highlightColor
      } else {
        ctx.fillStyle = backgroundColor
      }

      ctx.textAlign = "center"
      ctx.textBaseline = "top"

      // Scale font size based on the current zoom level
      let realFontSize = BASE_FONT_SIZE * yScale
      if (realFontSize < BASE_FONT_SIZE) realFontSize = BASE_FONT_SIZE // BASE_FONT_SIZE is the minimum font size
      if (realFontSize > MAX_FONT_SIZE) realFontSize = MAX_FONT_SIZE // BASE_FONT_SIZE is the minimum font size
      ctx.font = `bolder ${realFontSize}px ${FONT_FAMILY}`

      // Name tag width is the text width. Minimum width equals the NODE_SIZE
      const nameTagYOffset = thumbnail
        ? (thumbnail.naturalHeight * yScale) / 2
        : 0
      const PADDING = 32
      let nameTagWidth = ctx.measureText(name).width + PADDING
      if (nameTagWidth < NODE_SIZE) nameTagWidth = NODE_SIZE
      const nameTagHeight = realFontSize + (isGroup ? PADDING : 0)

      const textX = x - nameTagWidth / 2
      const textY = y + nameTagYOffset

      ctx.fillRect(textX, textY, nameTagWidth, nameTagHeight)

      ctx.lineWidth = 1
      if (isHighlighting && !doHighlightNode) {
        // There are highlighted nodes but this one isn't one of them
        ctx.strokeStyle = LOW_ATTENTION_COLOR
        ctx.fillStyle = LOW_ATTENTION_COLOR
      } else {
        // Normal fill color
        ctx.strokeStyle = "black"
        ctx.fillStyle = "black"
      }

      ctx.beginPath()
      ctx.strokeRect(textX, textY, nameTagWidth, nameTagHeight)

      ctx.fillStyle = node.textColor || DEFAULT_TEXT_COLOR
      ctx.fillText(
        name,
        textX + nameTagWidth / 2,
        textY + (isGroup ? PADDING / 1.5 : 0),
        nameTagWidth,
      )
      ctx.closePath()

      if (isGroup) {
        ctx.font = `${realFontSize / 2}px ${FONT_FAMILY}`
        ctx.fillText(
          "(group)",
          textX + nameTagWidth / 2,
          textY + PADDING / 1.5 - realFontSize / 2,
          nameTagWidth,
        )
      }

      if (isAreaPaint) {
        // ALL nodes including background nodes can be interacted with via their name tag
        // Paint pointer collision area (this color will not actually appear on the force graph)
        ctx.fillStyle = areaColor
        ctx.fillRect(textX, textY, nameTagWidth, nameTagHeight)
      }

      return { nameTagWidth, nameTagHeight }
    }

    function drawThumbnail() {
      const defaultReturnVal = { height: 0 }
      if (!thumbnail) return defaultReturnVal

      ctx.beginPath()

      const { naturalWidth, naturalHeight } = thumbnail
      const width = naturalWidth * xScale
      const height = naturalHeight * yScale
      const thumbnailX = x - width / 2
      const thumbnailY = y - height / 2

      try {
        // Draw the image (don't draw if painting area paint -- will crash)
        if (!isAreaPaint) {
          // Hide the thumbnail if node are being highlighted and this node isn't one of them
          if (isHighlighting && !doHighlightNode) return defaultReturnVal
          ctx.drawImage(thumbnail, thumbnailX, thumbnailY, width, height)
        }
      } catch (error) {
        // Missing image
        ctx.rect(thumbnailX, thumbnailY, width, height)
        ctx.fillStyle = "red"
        ctx.fill()
      }

      if (isSelected) {
        ctx.strokeStyle = highlightColor
        ctx.strokeRect(thumbnailX, thumbnailY, width, height)
      }

      if (doPointerDetection) {
        // Paint pointer collision area (this color will not actually appear on the force graph)
        ctx.fillStyle = areaColor
        ctx.fillRect(thumbnailX, thumbnailY, width, height)
      }

      return { height }
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
  if (!link || !link.source || !link.target) {
    return null
  }

  const srcNode = link.source as NodeObject & IPersonNode
  const targetNode = link.target as NodeObject & IPersonNode

  const { x: x1, y: y1, relationships: srcRels, id: srcId } = srcNode
  const { x: x2, y: y2, relationships: targetRels, id: targetId } = targetNode
  if (
    x1 === undefined ||
    y1 === undefined ||
    x2 === undefined ||
    y2 === undefined
  ) {
    return null
  }

  // Skip render if the node is a group and is hidden. True and undefined mean it's visible.
  if (
    srcNode.isGroup &&
    store.getState().ui.personNodeVisibility[srcId] === false
  )
    return
  if (
    targetNode.isGroup &&
    store.getState().ui.personNodeVisibility[targetId] === false
  )
    return

  const isHighlighting = highlightLinks.size > 0 || highlightNodes.size > 0
  const doHighlightLink = isHighlighting && highlightLinks.has(link)

  if (doHighlightLink) {
    ctx.strokeStyle = "yellow"
  } else if (isHighlighting) {
    // Links are being highlight but this link isn't one of them
    ctx.strokeStyle = LOW_ATTENTION_COLOR
  } else {
    // TODO: use link color after implementing link groups
    ctx.strokeStyle = DEFAULT_LINK_COLOR
  }

  let lineWidth = doHighlightLink ? DEFAULT_LINK_SIZE * 2 : DEFAULT_LINK_SIZE
  lineWidth /= currentZoom
  if (lineWidth < DEFAULT_LINK_SIZE) lineWidth = DEFAULT_LINK_SIZE
  if (doHighlightLink && lineWidth < DEFAULT_LINK_SIZE * 2)
    lineWidth = DEFAULT_LINK_SIZE * 2
  if (store.getState().ui.isSmallMode) lineWidth /= 2
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
    if (
      x1 === undefined ||
      x2 === undefined ||
      y1 === undefined ||
      y2 === undefined
    )
      return
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
      const MAX_HEAD_LENGTH = 50
      let headLen = MIN_HEAD_LENGTH / currentZoom
      if (headLen < MIN_HEAD_LENGTH) headLen = MIN_HEAD_LENGTH
      if (headLen > MAX_HEAD_LENGTH) headLen = MAX_HEAD_LENGTH

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

function handleLinkHover(container: HTMLDivElement) {
  return (link: LinkObject | null) => {
    const currentToolbarAction = store.getState().ui.toolbarAction
    const canHighlight = /(VIEW|LINK)/.test(currentToolbarAction)
    if (!canHighlight || nodeToConnect.node !== null) return

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

  const currentToolbarAction = store.getState().ui.toolbarAction
  const doShowLabel = /(VIEW|LINK)/.test(currentToolbarAction)
  if (!doShowLabel) return ""

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

function handleNodeHover(container: HTMLDivElement) {
  return (n: NodeObject | null) => {
    clearHighlights()
    container.style.cursor = n ? "pointer" : "grab"

    // Can only highlight in VIEW mode
    const currentToolbarAction = store.getState().ui.toolbarAction
    const canHighlight = currentToolbarAction === "VIEW"
    if (!n || !canHighlight) return
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

function handleNodeDrag(container: HTMLDivElement, Graph: ForceGraphInstance) {
  return (n: NodeObject | null, translate: XYVals) => {
    container.style.cursor = n ? "grabbing" : "grab"
    if (!n) return

    // MUST get latest node data -- otherwise changes to the graph won't be up to date
    const gDataNodes = Graph.graphData().nodes
    const id = n.id as string
    const selectedNodesToMove = getOtherSelectedNodes(id, gDataNodes)
    if (selectedNodesToMove === null) return

    selectedNodesToMove.forEach(translateSelected)

    // #region handleNodeDrag Helper Functions
    function translateSelected(selNode: NodeObject) {
      const { x, y, fx, fy } = selNode
      const xCoord = fx !== undefined ? fx : x!
      const yCoord = fy !== undefined ? fy : y!
      selNode.fx = xCoord + translate.x
      selNode.fy = yCoord + translate.y
    }
    // #endregion handleNodeDrag Helper Functions
  }
}

function getOtherSelectedNodes(currentId: string, gDataNodes: NodeObject[]) {
  const { selectedNodeIds } = store.getState().ui
  if (selectedNodeIds.includes(currentId)) {
    return selectedNodeIds
      .filter((selId) => selId !== currentId)
      .map((selId) => gDataNodes.find((node) => node.id === selId))
      .filter((node) => node !== undefined) as (NodeObject & IPersonNode)[]
  }

  return null
}

function handleNodeDragEnd(
  container: HTMLDivElement,
  state: ICurrentNetwork,
  Graph: ForceGraphInstance,
) {
  return async (n: NodeObject | null) => {
    if (!n) return
    const gDataNodes = Graph.graphData().nodes
    const node = n as IPersonNode & NodeObject

    const id = n.id as string
    const otherSelectedNodes = getOtherSelectedNodes(id, gDataNodes)
    const selNodes = otherSelectedNodes ? [node, ...otherSelectedNodes] : [node]

    const nodesToFix = selNodes
      .map(({ id: nodeId, isGroup, x, y }) => ({
        nodeId,
        isGroup,
        pinXY: { x, y },
      }))
      .filter(
        (nToFix) =>
          nToFix.pinXY.x !== undefined && nToFix.pinXY.y !== undefined,
      ) as { nodeId: string; isGroup: boolean; pinXY: XYVals }[]

    try {
      await store.dispatch<any>(pinMultipleNodes(state.id, nodesToFix))
    } catch (error) {
      console.error(error)
    }

    container.style.cursor = "grab"
  }
}

function handleNodeClick(Graph: ForceGraphInstance) {
  return async (n: NodeObject | null, event: MouseEvent) => {
    if (!n) return
    const node = n as NodeObject & IPersonNode
    const { toolbarAction, isViewingShared } = store.getState().ui
    const doMultiselect = event.altKey || event.ctrlKey || event.shiftKey

    switch (toolbarAction) {
      case "SELECT":
      case "RESIZE":
      case "MOVE": {
        if (node.isGroup) {
          handleGroupSelect(node.id)
          return
        }
        handleSelect(node.id)
        return
      }

      case "VIEW": {
        handleNodeView(node.id)
        return
      }

      case "LINK": {
        if (isViewingShared) return
        setMouseCoords(event) // This keeps the mouse position variables updated, since they otherwise update on mouse move
        await handleNodeLinking(Graph, node, doMultiselect)
        return
      }

      case "DELETE": {
        if (isViewingShared) return
        const doContinue = window.confirm(`Delete ${node.name}?`)
        if (!doContinue) return

        const networkId = store.getState().networks.currentNetwork?.id
        if (!networkId) return

        try {
          await store.dispatch<any>(deletePerson(networkId, node.id))
        } catch (error) {
          console.error(error)
        }
        return
      }

      case "TOGGLE_NAMETAG": {
        try {
          // Toggling based on node.doHideNameTag causes delays, meaning the user may need to click a node twice to actually toggle the node's nametag
          // Getting the node in global state fixes this, so users only need to click a node once to toggle it's name tag visibility
          const actualNode = store
            .getState()
            .networks.currentNetwork?.people.find((p) => p.id === node.id)
          if (!actualNode) return
          let doHide = actualNode.doHideNameTag
          if (doHide === undefined) doHide = false

          await store.dispatch<any>(setHideNameTag(node.id, !doHide))
        } catch (error) {
          console.error(error)
        }
        return
      }
    }

    // #region handleNodeClick Helper Functions
    async function handleNodeView(nodeId: string) {
      try {
        await store.dispatch<any>(setPersonInFocus(nodeId))
        store.dispatch<any>(togglePersonOverlay(true))
      } catch (error) {
        console.error(error)
      }
    }

    // Clicking a group in MOVE mode (de)selects all nodes in the group
    function handleGroupSelect(groupId: string) {
      const group = store
        .getState()
        .networks.currentNetwork?.people.find(
          (p) => p.isGroup && p.id === groupId,
        )
      if (!group) return

      const { selectedNodeIds } = store.getState().ui
      const selectedNodeIdsSet = new Set(selectedNodeIds)

      const nodeIdsInGroup = Object.keys(group.relationships)
      const entireGroupSelected = nodeIdsInGroup.every((id) =>
        selectedNodeIdsSet.has(id),
      )
      const shouldDeselectGroup =
        entireGroupSelected && selectedNodeIdsSet.has(groupId)

      if (shouldDeselectGroup) {
        nodeIdsInGroup.forEach((id) => selectedNodeIdsSet.delete(id))
        selectedNodeIdsSet.delete(groupId)
        store.dispatch<any>(selectNodes(Array.from(selectedNodeIdsSet)))
        return
      }

      if (!doMultiselect) selectedNodeIdsSet.clear()
      nodeIdsInGroup.forEach((id) => selectedNodeIdsSet.add(id))
      selectedNodeIdsSet.add(groupId)
      store.dispatch<any>(selectNodes(Array.from(selectedNodeIdsSet)))
    }

    function handleSelect(nodeId: string) {
      const { selectedNodeIds } = store.getState().ui
      const selectedNodeIdsSet = new Set(selectedNodeIds)

      if (doMultiselect) {
        if (selectedNodeIdsSet.has(nodeId)) selectedNodeIdsSet.delete(nodeId)
        else selectedNodeIdsSet.add(nodeId)
      } else if (
        selectedNodeIdsSet.size === 1 &&
        selectedNodeIdsSet.has(nodeId)
      ) {
        selectedNodeIdsSet.delete(nodeId)
      } else {
        selectedNodeIdsSet.clear()
        selectedNodeIdsSet.add(nodeId)
      }

      store.dispatch<any>(selectNodes(Array.from(selectedNodeIdsSet)))
    }
    // #endregion handleNodeClick Helper Functions
  }
}

function handleBackgroundClick(
  graph: ForceGraphInstance,
  currentNetwork: ICurrentNetwork,
) {
  return async (e: MouseEvent) => {
    cancelLinking()
    clearSelected()
    store.dispatch<any>(setPersonInFocus(null))

    // DO NOT allow click events if in sharing mode
    if (store.getState().ui.isViewingShared) return
    const toolbarAction = store.getState().ui.toolbarAction
    switch (toolbarAction) {
      case "CREATE": {
        await addPersonToGraph()
        return
      }
    }

    // #region Background Click Helper Functions
    async function addPersonToGraph() {
      const { x, y } = graph.screen2GraphCoords(e.offsetX, e.offsetY)

      try {
        const name = prompt("Create Node:")
        if (name === null) {
          return
        }

        await store.dispatch<any>(addPerson(currentNetwork.id, name, { x, y }))
        setTimeout(() => {
          clearHighlights()
        }, 10)
      } catch (error) {
        console.error(error)
      }
    }

    // #endregion Background Click Helper Functions
  }
}

// #region Node Linking
async function handleNodeLinking(
  Graph: ForceGraphInstance,
  node: NodeObject & IPersonNode,
  doContinue: boolean,
) {
  // DO NOT allow if in sharing mode
  if (store.getState().ui.isViewingShared) return

  const currentNetworkId = store.getState().networks.currentNetwork?.id
  if (!currentNetworkId) return

  // Connect two nodes
  if (!nodeToConnect.node) {
    // Picked the first node to dis(connect) or toggle in a group
    nodeToConnect.node = node as NodeObject & IPersonNode
  } else {
    // Picked the second node to dis(connect) or toggle in a group
    const isSelfConnection = nodeToConnect.node.id === node.id
    if (isSelfConnection) return // Self-Self connections are illegal

    const areNodesConnected = node.id in nodeToConnect.node.relationships
    // Disconnect the nodes if they are already connected
    try {
      if (areNodesConnected) {
        await store.dispatch<any>(
          disconnectPeople(currentNetworkId, {
            p1Id: nodeToConnect.node.id,
            p2Id: node.id,
          }),
        )
      } else {
        // Otherwise, connect the nodes
        await store.dispatch<any>(
          connectPeople(currentNetworkId, {
            p1Id: nodeToConnect.node.id,
            p2Id: node.id,
          }),
        )
      }
    } catch (error) {
      console.error(error)
    }

    // Continue linking...
    if (doContinue) {
      const updatedNode = Graph.graphData().nodes.find(
        (gNode) => gNode.id === nodeToConnect.node?.id,
      )
      nodeToConnect.node = (updatedNode as IPersonNode) || null
      return
    }

    // Or clean up
    clearNodeToConnect()
  }
}

function cancelLinking() {
  if (nodeToConnect.node) {
    nodeToConnect.node = null
    return
  }
}
// #endregion Node Linking

// Clears the node to connect. This stops the linking action if there is a node being connecting.
export function clearNodeToConnect() {
  nodeToConnect.node = null
}

function updateMouseCoords(e: MouseEvent) {
  setMouseCoords(e)
}

function setMouseOver(e: MouseEvent) {
  if (isMouseOver) return
  isMouseOver = true
}

function setMouseOut(e: MouseEvent) {
  if (!isMouseOver) return
  isMouseOver = false

  // Clear selection boxes if the mouse leaves the force graph canvas
  clearSelectionBoxes()
}

function setMouseCoords(e: MouseEvent) {
  mouseCoords.x = e.offsetX
  mouseCoords.y = e.offsetY
}

const selBoxAnchor: XYVals = { x: 0, y: 0 }
function setBoxSelecting(isDown: boolean, container: HTMLElement) {
  return (e: MouseEvent) => {
    const isRightMouseDown = e.button === 2
    if (!isRightMouseDown) return
    isBoxSelecting = isDown

    if (isDown) {
      const selectionBox = document.createElement("div")
      selectionBox.id = "nodeSelectBox"
      selBoxAnchor.x = e.offsetX
      selBoxAnchor.y = e.offsetY
      container.insertAdjacentElement("afterend", selectionBox)
    } else {
      clearSelectionBoxes()
    }
  }
}

function clearSelectionBoxes() {
  const selectionBoxes = document.querySelectorAll("#nodeSelectBox")
  selectionBoxes.forEach((box) => box?.remove())
}

function handleSelectBoxDrag(
  Graph: ForceGraphInstance,
  container: HTMLElement,
) {
  return (e: MouseEvent) => {
    if (!isBoxSelecting) return
    const selectionBox = document.querySelector(
      "#nodeSelectBox",
    ) as HTMLDivElement
    if (!selectionBox) return

    const width = container.offsetWidth
    const height = container.offsetHeight

    if (e.offsetX < selBoxAnchor.x) {
      selectionBox.style.right = `${width - selBoxAnchor.x}px`
      selectionBox.style.left = `${e.offsetX}px`
    } else {
      selectionBox.style.left = `${selBoxAnchor.x}px`
      selectionBox.style.right = `${width - e.offsetX}px`
    }

    if (e.offsetY < selBoxAnchor.y) {
      selectionBox.style.bottom = `${height - selBoxAnchor.y}px`
      selectionBox.style.top = `${e.offsetY}px`
    } else {
      selectionBox.style.top = `${selBoxAnchor.y}px`
      selectionBox.style.bottom = `${height - e.offsetY}px`
    }

    const startX = Number(selectionBox.style.left.replace("px", ""))
    const startY = Number(selectionBox.style.top.replace("px", ""))
    const endX = width - Number(selectionBox.style.right.replace("px", ""))
    const endY = height - Number(selectionBox.style.bottom.replace("px", ""))

    const startBounds = Graph.screen2GraphCoords(startX, startY)
    const endBounds = Graph.screen2GraphCoords(endX, endY)

    const toSelect = Graph.graphData()
      .nodes.filter((node) => {
        if ((node as IPersonNode).isBackground) return false // Exclude background nodes from drag selection
        if (!node.x || !node.y) return false
        const isInXBounds = node.x > startBounds.x && node.x < endBounds.x
        const isInYBounds = node.y > startBounds.y && node.y < endBounds.y
        return isInXBounds && isInYBounds
      })
      .map((n) => n.id as string)

    const isMultiselecting = e.shiftKey || e.altKey || e.ctrlKey
    if (isMultiselecting) {
      const currentSelectedNodes = new Set(store.getState().ui.selectedNodeIds)
      for (const sel of toSelect) {
        currentSelectedNodes.add(sel)
      }
      store.dispatch(selectNodes(Array.from(currentSelectedNodes)))
      return
    }

    store.dispatch(selectNodes(toSelect))
  }
}

function hideContextMenu(e: Event) {
  e.preventDefault()
  return false
}

const PAN_SPEED = 25
let keysDown: { [keyName: string]: boolean } = {}
let toCopy: string[] = []
let copyAnchorXY = { x: 0, y: 0 }

// For combos that shouldn't be repeated while key combos are held down
// Using this logic instead of "keypress" event because keypress does not preventdefault and detect mutliple keys properly
let activeKeyCombos: { [combo: string]: boolean } = {}
enum KeyCombos {
  SELECT_ALL = "SELECT_ALL",
  COPY = "COPY",
  PASTE = "PASTE",
  DUPLICATE = "DUPLICATE",
  QUICK_DELETE = "QUICK_DELETE",
}

// Short keys that require multiple keys down
// e.g. this allows diagonal arrow key panning
function handleMultiShortkeys(Graph: ForceGraphInstance) {
  return async (e: KeyboardEvent) => {
    keysDown[e.key] = true
    const { isViewingShared, selectedNodeIds } = store.getState().ui

    if (e.ctrlKey) {
      switch (e.key) {
        case "a": {
          if (activeKeyCombos[KeyCombos.SELECT_ALL]) return
          activeKeyCombos[KeyCombos.SELECT_ALL] = true

          e.preventDefault()
          selectAllNodes(Graph)
          return
        }

        case "c": {
          if (activeKeyCombos[KeyCombos.COPY]) return
          activeKeyCombos[KeyCombos.COPY] = true

          if (isViewingShared) return
          copyAnchorXY = Graph.screen2GraphCoords(mouseCoords.x, mouseCoords.y)
          toCopy = [...selectedNodeIds]
          return
        }
      }

      // Paste & Duplicate
      if (e.key.match(/(v|d)/)) {
        e.preventDefault()
        e.stopPropagation()
        if (isViewingShared) return
        if (toCopy.length === 0) return

        const networkId = store.getState().networks.currentNetwork?.id
        if (!networkId) return

        const targetXY = Graph.screen2GraphCoords(mouseCoords.x, mouseCoords.y)

        if (e.key === "v") {
          if (activeKeyCombos[KeyCombos.PASTE]) return
          activeKeyCombos[KeyCombos.PASTE] = true
          _handleDuplicateNode(networkId, targetXY, true)
          return
        } else if (e.key === "d") {
          // Duplicate maintains relationships
          if (activeKeyCombos[KeyCombos.DUPLICATE]) return
          activeKeyCombos[KeyCombos.DUPLICATE] = true
          _handleDuplicateNode(networkId, targetXY, false)
          return
        }
      }
    }

    switch (e.key) {
      case "v": {
        store.dispatch(setToolbarAction("VIEW"))
        return
      }

      case "s": {
        store.dispatch(setToolbarAction("SELECT"))
        return
      }

      case "m": {
        store.dispatch(setToolbarAction("MOVE"))
        return
      }

      case "c": {
        if (isViewingShared) return
        store.dispatch(setToolbarAction("CREATE"))
        return
      }

      case "l": {
        if (isViewingShared) return
        store.dispatch(setToolbarAction("LINK"))
        return
      }

      case "r": {
        store.dispatch(setToolbarAction("RESIZE"))
        return
      }

      case "d": {
        if (isViewingShared) return
        store.dispatch(setToolbarAction("DELETE"))
        return
      }

      case "n": {
        store.dispatch(setToolbarAction("TOGGLE_NAMETAG"))
        return
      }

      case "Delete":
      case "Backspace": {
        if (isViewingShared) return
        if (activeKeyCombos[KeyCombos.QUICK_DELETE]) return
        activeKeyCombos[KeyCombos.QUICK_DELETE] = true

        if (selectedNodeIds.length === 0) return

        const networkId = store.getState().networks.currentNetwork?.id
        if (!networkId) return

        const doContinue = window.confirm(
          `Delete ${selectedNodeIds.length} selected nodes?`,
        )
        if (!doContinue) return

        for (const nodeId of selectedNodeIds) {
          store.dispatch<any>(deletePerson(networkId, nodeId))
        }
        store.dispatch(selectNodes([]))
        return
      }
    }

    // Arrow Key Panning
    let deltaX = 0
    let deltaY = 0

    if (keysDown["ArrowUp"]) {
      deltaY = -PAN_SPEED
    } else if (keysDown["ArrowDown"]) {
      deltaY = PAN_SPEED
    }

    if (keysDown["ArrowLeft"]) {
      deltaX = -PAN_SPEED
    } else if (keysDown["ArrowRight"]) {
      deltaX = PAN_SPEED
    }

    if (deltaX === 0 && deltaY === 0) return
    panBy(Graph, { deltaX, deltaY })
  }
}

function clearKeysDown() {
  activeKeyCombos = {}
  keysDown = {}
}

function _handleDuplicateNode(
  networkId: string,
  targetXY: XYVals,
  doClearFormatting: boolean,
) {
  store.dispatch<any>(
    duplicateNodes(networkId, toCopy, {
      clearFormatting: doClearFormatting,
      pin: {
        anchor: copyAnchorXY,
        target: targetXY,
      },
    }),
  )
  return
}

function panBy(
  Graph: ForceGraphInstance,
  { deltaX = 0, deltaY = 0 }: { deltaX?: number; deltaY?: number },
) {
  const pan = Graph.centerAt()
  Graph.centerAt(pan.x + deltaX, pan.y + deltaY)
}

function selectAllNodes(Graph: ForceGraphInstance) {
  const allNodeIds = Graph.graphData().nodes.map((n) => n.id as string)
  store.dispatch(selectNodes(allNodeIds))
}

/**
 * @returns function to clean up listeners
 */
export function addCustomListeners(
  container: HTMLElement,
  Graph: ForceGraphInstance,
) {
  container.tabIndex = 0 // This makes the container focusable, enabling keydown events
  container.addEventListener("mousemove", updateMouseCoords)
  container.addEventListener("mouseup", setMouseCoords)

  container.addEventListener("mouseenter", setMouseOver)
  container.addEventListener("mouseleave", setMouseOut)

  container.addEventListener("pointerdown", setBoxSelecting(true, container))
  container.addEventListener("pointerup", setBoxSelecting(false, container))
  container.addEventListener(
    "pointermove",
    handleSelectBoxDrag(Graph, container),
  )
  container.addEventListener("contextmenu", hideContextMenu)
  container.addEventListener("keydown", handleMultiShortkeys(Graph))
  container.addEventListener("keyup", clearKeysDown)

  return () => {
    container.removeEventListener("mousemove", updateMouseCoords)
    container.removeEventListener("mouseup", setMouseCoords)

    container.removeEventListener("mouseenter", setMouseOver)
    container.removeEventListener("mouseleave", setMouseOut)

    container.removeEventListener(
      "pointerdown",
      setBoxSelecting(true, container),
    )
    container.removeEventListener(
      "pointerup",
      setBoxSelecting(false, container),
    )
    container.removeEventListener(
      "pointermove",
      handleSelectBoxDrag(Graph, container),
    )
    container.removeEventListener("contextmenu", hideContextMenu)
    container.removeEventListener("keydown", handleMultiShortkeys(Graph))
    container.removeEventListener("keyup", clearKeysDown)
  }
}

function handleZoomPan(transform: { k: number; x: number; y: number }) {
  currentZoom = transform.k

  if (isPanningOrZooming) return
  isPanningOrZooming = true
}

function handleZoomPanEnd(transform: { k: number; x: number; y: number }) {
  if (!isPanningOrZooming) return
  isPanningOrZooming = false
}

async function handleLinkClick(link: LinkObject) {
  if (typeof link.source === "string" || typeof link.target === "string") return
  const srcNode = link.source as IPersonNode | undefined
  const targetNode = link.target as IPersonNode | undefined
  if (!srcNode || !targetNode) return

  const currentToolbarAction = store.getState().ui.toolbarAction
  const doOpenPathOverlay =
    currentToolbarAction === "VIEW" || currentToolbarAction === "LINK"
  if (doOpenPathOverlay) {
    const content = {
      paths: [
        [
          {
            id: srcNode.id,
            name: srcNode.name,
            description: srcNode.relationships[targetNode.id].reason,
          },
          {
            id: targetNode.id,
            name: targetNode.name,
            description: targetNode.relationships[srcNode.id].reason,
          },
        ],
      ],
      person1: srcNode,
      person2: targetNode,
    }

    store.dispatch(setPathOverlayContent(content))
    return
  }

  // DO NOT allow link editing in Shared Mode
  if (store.getState().ui.isViewingShared) return

  // Edit a relationship reason via LINK mode
  const doEditLink = currentToolbarAction === "LINK"
  if (!doEditLink) return

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

// Bigger nodes will render first, with smaller nodes appearing on top of them
export function sortNodesBySize(gData: IForceGraphData) {
  gData.nodes.sort((a, b) => {
    const sizeA = a.thumbnail
      ? a.thumbnail.naturalWidth *
        (a.scaleXY ? a.scaleXY.x : 1) *
        a.thumbnail.naturalHeight *
        (a.scaleXY ? a.scaleXY.y : 1)
      : 0
    const sizeB = b.thumbnail
      ? b.thumbnail.naturalWidth *
        (b.scaleXY ? b.scaleXY.x : 1) *
        b.thumbnail.naturalHeight *
        (b.scaleXY ? b.scaleXY.y : 1)
      : 0
    if (sizeA !== sizeB) return sizeB - sizeA
    else return b.name.length - a.name.length
  })
}

export function clearSelected() {
  const { selectedNodeIds } = store.getState().ui
  if (selectedNodeIds.length === 0) return
  store.dispatch<any>(selectNodes([]))
}

// #endregion HELPER FUNCTIONS
