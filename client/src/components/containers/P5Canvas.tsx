import React from "react"

import p5 from "p5"
import Canvas from "../Canvas"
import { CSSProperties } from "styled-components"

const P5Canvas: React.FC<IProps> = (props) => {
  /* create a ref for forwarding to the Canvas presentational component */
  const canvasRef = React.createRef<HTMLDivElement>()

  // ==- Load the P5 Sketch -== //
  React.useEffect(() => {
    const container = canvasRef.current

    if (container) {
      /* set canvas width and height based on container dimensions */
      const state: ISketchDimensions & { [key: string]: any } = props.state

      /* instantiate the p5 sketch */
      const sketch = props.createSketch(container, state)

      /* destroy sketch upon clean up */
      return () => {
        sketch.remove()
      }
    }
  }, [])

  return <Canvas id={props.id} ref={canvasRef} style={props.style} />
}

export default P5Canvas

// ==- TYPE DEFINITIONS -== //
interface IProps {
  style?: CSSProperties
  id: string
  state: any
  createSketch: SketchCreator<any>
}

/* function that returns a P5 sketch instance with access to some state parameter  */
/* sketch creators will define their own state interfaces */
export type SketchCreator<T> = (
  container: HTMLDivElement,
  state: T & ISketchDimensions,
) => p5

export interface ISketchDimensions {
  canvasWidth: number
  canvasHeight: number
}
