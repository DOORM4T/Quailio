import p5 from "p5"
import { SketchCreator } from "../components/Canvas"

export interface INetworkSketchState {
  offsetX: number
  offsetY: number
  scale: number
  people: any[]
}

export const createNetworkSketch: SketchCreator<INetworkSketchState> = (
  container,
  state,
) => {
  // ==- Configure Canvas Dimensions -== //
  state.canvasWidth = container.offsetWidth || 500
  state.canvasHeight = container.offsetHeight || 500

  // ==- P5 Sketch -== //
  const sketch = (p: p5) => {
    // Canvas setup
    p.setup = () => {
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
    }

    // Draw network things every frame
    p.draw = () => {
      p.background(204)
      p.fill(255)

      if (
        p.mouseIsPressed &&
        isMouseInCanvas(p, state.canvasWidth, state.canvasHeight)
      ) {
        state.offsetX += p.mouseX - p.pmouseX
        state.offsetY += p.mouseY - p.pmouseY
      }

      p.rect(state.offsetX, state.offsetY, 50 * state.scale, 50 * state.scale)
    }

    // Resize canvas when the window resize
    window.addEventListener("resize", () => {
      state.canvasWidth = container.offsetWidth || 500
      state.canvasHeight = container.offsetHeight || 500
      p.resizeCanvas(state.canvasWidth, state.canvasHeight)
    })
  }

  // ==- Return P5 Sketch Instance -== //
  return new p5(sketch, container)
}

function isMouseInCanvas(p: p5, canvasWidth: number, canvasHeight: number) {
  const isBelowBounds = p.mouseX < 0 || p.mouseY < 0
  const isAboveBounds = p.mouseX > canvasWidth || p.mouseY > canvasHeight
  if (isBelowBounds || isAboveBounds) return false
  return true
}
