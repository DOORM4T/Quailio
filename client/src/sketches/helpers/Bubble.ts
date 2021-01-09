import p5 from "p5"
import { IPerson } from "../../network"
import { Color, IBaseSketchProperties } from "./sketchTypes"
export const BUBBLE_RADIUS = 50
export default class Bubble<T extends IBaseSketchProperties> {
  private x
  private y
  private opacity = 0
  private animationSpeed = 0.05
  private radius = BUBBLE_RADIUS / 2

  constructor(
    public p: p5,
    public person: IPerson,
    public otherBubbles: Bubble<T>[],
    state: T,
    public text?: string,
    public nodeColor: Color = [255, 255, 255],
    public textColor: Color = [0, 0, 0],
  ) {
    this.x = state.offsetX
    this.y = state.offsetY
    this.text = person.name
    this.fadeIn()
  }

  public draw() {
    const p = this.p

    p.stroke("black")

    if (this.isTouchingMouse()) {
      p.fill("green")
      // if (p.mouseIsPressed) {
      //   this.x = p.mouseX
      //   this.y = p.mouseY
      // }
    } else {
      p.fill(...this.nodeColor, this.opacity)
    }

    p.ellipse(this.x, this.y, this.radius, this.radius)

    if (this.text) {
      p.noStroke()
      p.fill(this.textColor)
      const widthOffset = p.textWidth(this.text) / 2
      p.text(this.text, this.x - widthOffset, this.y)
    }

    if (this.isColliding()) {
      // if (this.isTouchingMouse()) return
      this.x += p.random(-1, 1) * this.radius * p.random(1, 3)
      this.y += p.random(-1, 1) * this.radius * p.random(1, 3)
      p.noFill()
    }
  }

  public isTouching(otherBubble: Bubble<T>) {
    const dist = this.p.dist(this.x, this.y, otherBubble.x, otherBubble.y)
    return dist <= 2 * this.radius
  }

  public isTouchingMouse() {
    const dist = this.p.dist(this.x, this.y, this.p.mouseX, this.p.mouseY)
    return dist <= this.radius * 2
  }

  public isColliding() {
    return this.otherBubbles.some((b) => this !== b && this.isTouching(b))
  }

  private async fadeIn() {
    while (this.opacity < 255 || this.radius < BUBBLE_RADIUS) {
      await new Promise((res) => {
        setTimeout(() => {
          this.opacity += this.animationSpeed
          this.radius += this.animationSpeed
          this.animationSpeed += 30

          this.opacity = this.p.constrain(this.opacity, 0, 255)
          this.radius = this.p.constrain(this.radius, 0, BUBBLE_RADIUS)
          res(null)
        }, 10)
      })
    }
  }
}
