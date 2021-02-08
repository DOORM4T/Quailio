export const UNSAVED_CHANGE_EVENT = "unsavedchange"

export function fireUnsavedChangeEvent() {
  const unsavedChangeEvent = new CustomEvent(UNSAVED_CHANGE_EVENT, {
    cancelable: true,
  })

  /* True if preventDefault is called by the event callback */
  return window.dispatchEvent(unsavedChangeEvent)
}

export function addUnsavedChangeListener(callback: (e: Event) => void) {
  window.addEventListener(UNSAVED_CHANGE_EVENT, callback)
  window.addEventListener("beforeunload", callback)
}

export function removeUnsavedChangeListener(callback: (e: Event) => void) {
  window.removeEventListener(UNSAVED_CHANGE_EVENT, callback)
  window.removeEventListener("beforeunload", callback)
}
