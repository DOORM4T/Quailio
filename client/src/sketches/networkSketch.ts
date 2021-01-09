import p5 from "p5"
import { SketchCreator } from "../components/containers/P5Canvas"
import { INetworkSketchState } from "../network"
import Bubble, { BUBBLE_RADIUS } from "./helpers/Bubble"
import { isMouseInCanvas } from "./helpers/isMouseInCanvas"
import { IBaseSketchProperties } from "./helpers/sketchTypes"

export const createNetworkSketch: SketchCreator<
  INetworkSketchState & IBaseSketchProperties
> = (container, state) => {
  console.log(state)

  /* Configure canvas dimensions */
  state.canvasWidth = container.offsetWidth || 500
  state.canvasHeight = container.offsetHeight || 500

  let centerX = state.canvasWidth / 2
  let centerY = state.canvasHeight / 2

  /* center canvas */
  state.offsetX = centerX
  state.offsetY = centerY

  /* array of bubbles to draw */
  const bubbles: Bubble<INetworkSketchState & IBaseSketchProperties>[] = []

  /* P5 sketch */
  const sketch = (p: p5) => {
    // Canvas setup
    p.setup = () => {
      /* initialize bubbles */
      state.people.forEach((person) => {
        bubbles.push(new Bubble(p, person, bubbles, state))
      })

      p.textAlign(p.CENTER)
      p.ellipseMode(p.RADIUS)
      p.frameRate(60)
      p.createCanvas(state.canvasWidth, state.canvasHeight)
    }

    // Zoom with scroll wheel
    const SCROLL_SCALE = 0.01
    const MIN_SCALE = 0.5
    const MAX_SCALE = 5
    p.mouseWheel = (e: WheelEvent) => {
      if (!isMouseInCanvas(p, state.canvasWidth, state.canvasHeight)) return

      const delta = -e.deltaY * SCROLL_SCALE
      state.scale += delta
      state.scale = p.constrain(state.scale, MIN_SCALE, MAX_SCALE)

      /* center zooming at mouse point */
      state.offsetX = p.mouseX
      state.offsetY = p.mouseY
    }

    p.doubleClicked = (e: MouseEvent) => {
      state.offsetX = centerX
      state.offsetX = centerY
      state.scale = 1
    }

    // Draw network things every frame
    p.draw = () => {
      p.background(204)
      p.fill(255)

      if (
        p.mouseIsPressed &&
        isMouseInCanvas(p, state.canvasWidth, state.canvasHeight)
      ) {
        state.offsetX += p.pmouseX - p.mouseX
        state.offsetY += p.pmouseY - p.mouseY
      }

      /* show panned canvas */
      // TODO: Fix panning issue. See black circle
      p.translate(p.width / 2, p.height / 2)
      p.scale(state.scale)
      p.translate(-state.offsetX, -state.offsetY)

      /* draw circles */
      bubbles.forEach((b) => {
        if ("draw" in b) {
          b.draw()
        }
      })

      p.stroke("red")
      p.line(centerX, 1000, centerX, -1000)
      p.line(-1000, centerY, 1000, centerY)

      p.ellipse(p.mouseX, p.mouseY, BUBBLE_RADIUS, BUBBLE_RADIUS)
      p.fill("white")
      p.stroke("black")
      p.text(
        `(${p.round(p.mouseX)} ${p.round(p.mouseY)}) (${state.offsetX}, ${
          state.offsetY
        })`,
        p.mouseX,
        p.mouseY,
      )
    }

    // Resize canvas when the window resize
    window.addEventListener("resize", () => {
      state.canvasWidth = container.offsetWidth || 500
      state.canvasHeight = container.offsetHeight || 500
      centerX = state.canvasWidth / 2
      centerY = state.canvasHeight / 2
      p.resizeCanvas(state.canvasWidth, state.canvasHeight)
    })
  }

  /* Return P5 Sketch Instance */
  return new p5(sketch, container)
}
