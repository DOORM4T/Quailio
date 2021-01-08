import React from "react"
import p5 from "p5"
import { Box } from "grommet"
import { CSSProperties } from "styled-components"

const Canvas: React.FC<IProps> = (props) => {
  const canvasRef = React.useRef<HTMLDivElement>(null)

  // ==- Load the P5 Sketch -== //
  React.useEffect(() => {
    const container = canvasRef.current

    if (container) {
      /* set canvas width and height based on container dimensions */
      const state: ISketchDimensions & { [key: string]: any } = props.state

      /* instantiate the p5 sketch */
      const sketch = props.createSketch(container, state)

      /* clean up */
      return () => {
        sketch.remove()
      }
    }
  }, [props])

  return (
    <Box
      fill
      id={props.id}
      ref={canvasRef}
      align="center"
      style={props.style}
    />
  )
}

export default Canvas

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
