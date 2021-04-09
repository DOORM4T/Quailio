const resizeEvent = new CustomEvent("resize")

// Fire a resize event programmatically
// this can be used to trigger a ForceGraphCanvas resize without having to call the resize function from a ref
export function fireResizeEvent() {
  window.dispatchEvent(resizeEvent)
}
