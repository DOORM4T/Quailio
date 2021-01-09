import p5 from "p5"

export function isMouseInCanvas(
  p: p5,
  canvasWidth: number,
  canvasHeight: number,
) {
  const isBelowBounds = p.mouseX < 0 || p.mouseY < 0
  const isAboveBounds = p.mouseX > canvasWidth || p.mouseY > canvasHeight
  if (isBelowBounds || isAboveBounds) return false
  return true
}
