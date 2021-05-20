export const CUSTOM_EVENT_NAMES = {
  resize: "resize",
  fit: "fit",
}

const resizeEvent = new CustomEvent(CUSTOM_EVENT_NAMES.resize)

// Fire a resize event programmatically
// this can be used to trigger a ForceGraphCanvas resize without having to call the resize function from a ref
export function fireResizeEvent() {
  window.dispatchEvent(resizeEvent)
}

const fitCanvasEvent = new CustomEvent(CUSTOM_EVENT_NAMES.fit)
export function fireFitCanvasEvent() {
  window.dispatchEvent(fitCanvasEvent)
}
