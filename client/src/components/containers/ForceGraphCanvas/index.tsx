import deepEqual from "deep-equal"
import { ForceGraphInstance } from "force-graph"
import React, { CSSProperties } from "react"
import { ICurrentNetwork } from "../../../store/networks/networkTypes"
import Canvas from "../../Canvas"
import { createNetworkGraph } from "./NetworkGraph"

/* Empty default state for when the Current Network is null */
const emptyState: ICurrentNetwork = {
  id: "",
  name: "",
  people: [],
  personIds: [],
}

const ForceGraphCanvas: React.FC<IProps> = (props) => {
  /* create a ref for forwarding to the Canvas presentational component */
  const canvasRef = React.createRef<HTMLDivElement>()

  // ==- Load the P5 Sketch -== //
  React.useEffect(() => {
    const graphState = props.state ? props.state : emptyState

    const container = canvasRef.current

    if (container) {
      /* TODO: remove when anonymous networks are implemented 
      Whether the graph Dispatches Redux actions or not */
      const isDisconnected = Boolean(props.disconnected)

      /* set canvas width and height based on container dimensions */
      const forceGraph = createNetworkGraph(
        container,
        graphState,
        isDisconnected,
      ) as ForceGraphInstance

      const handleResize = () => {
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
        forceGraph._destructor()
      }
    }
  }, [props])

  return <Canvas id={props.id} ref={canvasRef} style={props.style} />
}

export default React.memo(ForceGraphCanvas, (prevProps, nextProps) => {
  /* Rerender only if the "people" names or relationships changed */
  const skipRerender = deepEqual(
    prevProps.state?.people.map((p) => ({
      name: p.name,
      relationships: p.relationships,
    })),
    nextProps.state?.people.map((p) => ({
      name: p.name,
      relationships: p.relationships,
    })),
  )

  return skipRerender
})

// ==- TYPE DEFINITIONS -== //
interface IProps {
  style?: CSSProperties
  id: string
  state: ICurrentNetwork | null
  disconnected?: boolean
}
