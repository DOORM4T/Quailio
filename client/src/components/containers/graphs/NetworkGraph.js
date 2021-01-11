import ForceGraph from "force-graph"
import {
  addPerson,
  connectPeople,
  setNetworkLoading,
} from "../../../store/networks/networksActions"
import { store } from "../../../store/store"

const FOCUS_TIME = 1000
const NODE_SIZE = 12

/**
 *
 * @param {HTMLDivElement} container
 * @param {import("../../../sketches/helpers/sketchTypes").INetworkSketchState} state
 */
export function createNetworkGraph(container, state, disconnected) {
  const gData = {
    nodes: state.people.map((person) => {
      let thumbnail = null
      if (person.thumbnail_url) {
        thumbnail = new Image()
        thumbnail.src = person.thumbnail_url
      }

      return {
        id: person.name,
        thumbnail,
        neighbors: [],
        relationships: person.relationships,
      }
    }),
    links: [],
  }

  state.people.forEach((person) => {
    Object.keys(person.relationships).forEach((name) => {
      if (!gData.nodes.some((person) => person.id === name)) return
      gData.links.push({
        source: person.name,
        target: name,
      })
    })
  })

  // set neighbors
  gData.links.forEach((link) => {
    const a = gData.nodes.find((node) => node.id === link.source)
    const b = gData.nodes.find((node) => node.id === link.target)
    if (!a || !b) return

    a.neighbors.push(b)
    b.neighbors.push(a)
  })

  // for highlighted on hover
  const highlightNodes = new Set()
  const highlightLinks = new Set()
  let hoverNode = null

  // for adding connections
  let nodeToConnect = null

  const Graph = ForceGraph()(container)
    .graphData(gData)
    .nodeRelSize(NODE_SIZE)
    .nodeCanvasObject((node, ctx) => {
      const { thumbnail, x, y } = node

      // add ring just for highlighted nodes
      if (highlightNodes.has(node)) {
        ctx.beginPath()
        const highlightSize = NODE_SIZE * 1.2

        ctx.rect(
          x - highlightSize / 2,
          y - highlightSize / 2,
          highlightSize,
          highlightSize,
        )
        ctx.fillStyle = node === hoverNode ? "red" : "orange"
        ctx.fill()
      }

      if (thumbnail) {
        /* show profile pictures */
        ctx.drawImage(
          thumbnail,
          x - NODE_SIZE / 2,
          y - NODE_SIZE / 2,
          NODE_SIZE,
          NODE_SIZE,
        )
      } else {
        ctx.beginPath()
        ctx.rect(x - NODE_SIZE / 2, y - NODE_SIZE / 2, NODE_SIZE, NODE_SIZE)
        ctx.fillStyle = "white"
        ctx.fill()
        ctx.strokeStyle = "black"
        ctx.stroke()
      }
    })
    .nodeLabel("id")
    .nodeAutoColorBy("id")
    .linkDirectionalParticles(1)
    .linkDirectionalParticleWidth(1.4)
    .onLinkHover((link) => {
      highlightNodes.clear()
      highlightLinks.clear()

      if (link) {
        highlightLinks.add(link)
        highlightNodes.add(link.source)
        highlightNodes.add(link.target)
      }
    })
    .linkLabel((link) => {
      const [rel1, rel2] = link.source.relationships[link.target.id]
      return `${link.source.id} (${rel1}) - ${link.target.id} (${rel2})`
    })
    .linkWidth((link) => (highlightLinks.has(link) ? 5 : 1))
    .linkColor((link) => (highlightLinks.has(link) ? "yellow" : "black"))
    .onNodeHover((node) => {
      highlightNodes.clear()
      highlightLinks.clear()
      if (node) {
        highlightNodes.add(node)
        node.neighbors.forEach((neighbor) => highlightNodes.add(neighbor))
        gData.links.forEach((link) => {
          if (link.source === node.id || link.target === node.id)
            highlightLinks.add(link)
        })
      }

      hoverNode = node || null
      container.style.cursor = node ? "-webkit-grab" : null
    })
    .onNodeClick((node) => {
      // TODO: Show modal via Redux dispatch

      /* zoom & center on click */
      Graph.centerAt(node.x, node.y, FOCUS_TIME / 2)
      Graph.zoom(10, FOCUS_TIME)
    })
    .onNodeDragEnd((node) => {
      /* fix at end drag position */
      node.fx = node.x
      node.fy = node.y
    })
    .onBackgroundRightClick(async () => {
      if (disconnected) return

      try {
        const name = prompt("Add Person:")
        if (name === null) {
          alert("Canceled node creation")
          return
        }

        await store.dispatch(addPerson(state.id, name))
      } catch (error) {
        console.error(error)
        store.dispatch(setNetworkLoading(false))
      }
    })
    .onNodeRightClick(async (node) => {
      if (disconnected) return

      if (!nodeToConnect) {
        alert(`Link A: ${node.id}`)
        nodeToConnect = node
      } else {
        alert(`Link B: ${node.id}`)
        try {
          const p1Reason = prompt("What is Person 1 to Person 2?")
          if (p1Reason === null) {
            alert("Canceled node connection.")
            return
          }

          const p2Reason = prompt("What is Person 2 to Person 1?")
          if (p2Reason === null) {
            alert("Canceled node connection.")
            return
          }

          await store.dispatch(
            connectPeople(
              state.id,
              nodeToConnect.id,
              node.id,
              p1Reason,
              p2Reason,
            ),
          )
        } catch (error) {
          console.error(error)
          store.dispatch(setNetworkLoading(false))
        }
      }
    })
  return Graph
}
