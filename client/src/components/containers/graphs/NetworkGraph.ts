import ForceGraph, { LinkObject, NodeObject } from "force-graph"
import {
  addPerson,
  connectPeople,
} from "../../../store/networks/networksActions"
import {
  ICurrentNetwork,
  IRelationships,
} from "../../../store/networks/networkTypes"
import { store } from "../../../store/store"
import {
  setPersonInFocus,
  togglePersonEditMenu,
} from "../../../store/ui/uiActions"

const FOCUS_TIME = 1000
const NODE_SIZE = 12

interface IForceGraphData {
  nodes: IPersonNode[]
  links: LinkObject[]
}

interface IPersonNode {
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
  disconnected: boolean,
) {
  /* Create nodes from the People in the current Network */
  const gData: IForceGraphData = {
    nodes: state.people.map((person) => {
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
    }),
    links: [],
  }

  /* Link people by their relationship fields */
  state.people.forEach((person) => {
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
  })

  // Set neighbors
  gData.links.forEach((link) => {
    const a = gData.nodes.find((node) => node.id === link.source)
    const b = gData.nodes.find((node) => node.id === link.target)
    if (!a || !b) return

    a.neighbors.push(b)
    b.neighbors.push(a)
  })

  // For highlight on hover
  const highlightNodes = new Set()
  const highlightLinks = new Set()
  let hoverNode: IPersonNode | null = null

  // For adding connections
  let nodeToConnect: IPersonNode | null = null

  const Graph = ForceGraph()(container)
    .graphData(gData)
    .nodeRelSize(NODE_SIZE)
    .nodeCanvasObject((node, ctx) => {
      const { thumbnail, x = 0, y = 0 } = node as NodeObject & IPersonNode

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
    })
    .nodeLabel("name")
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
    .linkLabel((link: any) => {
      const [rel1, rel2] = link.source.relationships[link.target.id]
      return `${link.source.name} (${rel1}) - ${link.target.name} (${rel2})`
    })
    .linkWidth((link) => (highlightLinks.has(link) ? 5 : 1))
    .linkColor((link) => (highlightLinks.has(link) ? "yellow" : "black"))
    .onNodeHover((n) => {
      const node = n as NodeObject & IPersonNode
      highlightNodes.clear()
      highlightLinks.clear()
      if (node) {
        highlightNodes.add(n)
        node.neighbors.forEach((neighbor) => highlightNodes.add(neighbor))
        gData.links.forEach((link) => {
          if (link.source === node.id || link.target === node.id)
            highlightLinks.add(link)
        })
      }

      hoverNode = node || null
      container.style.cursor = node ? "-webkit-grab" : ""
    })
    .onNodeClick(async (n) => {
      const node = n as NodeObject & IPersonNode
      try {
        // Focus on the clicked person & show their details
        await store.dispatch<any>(setPersonInFocus(node.id))
        store.dispatch<any>(togglePersonEditMenu(true))
      } catch (error) {
        console.error(error)
      }
    })
    .onNodeDragEnd((node) => {
      /* fix at end drag position */
      node.fx = node.x
      node.fy = node.y
    })
    .onBackgroundRightClick(async () => {
      if (disconnected) return

      /* if the user is in the middle of making a node connection  */
      if (nodeToConnect) {
        const doCancelConnectionAction = window.confirm(
          "Cancel connection? Press OK to cancel the connection.",
        )
        if (doCancelConnectionAction) {
          nodeToConnect = null
        }
        return
      }

      try {
        const name = prompt("Add Person:")
        if (name === null) {
          alert("Canceled node creation")
          return
        }

        await store.dispatch<any>(addPerson(state.id, name))
      } catch (error) {
        console.error(error)
      }
    })
    .onNodeRightClick(async (n) => {
      const node = n as NodeObject & IPersonNode

      /* Stop if "disconnected" from Redux -- TODO: disconnect should only cancel database persistence for a demo dashboard */
      if (disconnected) return

      /* Connect nodes */
      if (!nodeToConnect) {
        /* First node in the connection */
        alert(`Link A: ${node.name}`)
        nodeToConnect = node as NodeObject & IPersonNode
      } else {
        /* Connect the second node */
        alert(`Link B: ${node.name}`)

        /* Ask for relationship reasons */
        const p1Reason = prompt("What is Person 1 to Person 2?")
        if (p1Reason === null) {
          alert("Canceled node connection.")
          nodeToConnect = null
          return
        }

        const p2Reason = prompt("What is Person 2 to Person 1?")
        if (p2Reason === null) {
          alert("Canceled node connection.")
          nodeToConnect = null
          return
        }

        try {
          await store.dispatch<any>(
            connectPeople(state.id, {
              p1Id: nodeToConnect.id,
              p2Id: node.id,
              p1Reason,
              p2Reason,
            }),
          )
        } catch (error) {
          console.error(error)
        }
      }
    })
    .backgroundColor("#444")

  return Graph
}
