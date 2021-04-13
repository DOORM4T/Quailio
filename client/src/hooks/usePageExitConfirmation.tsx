import React from "react"

// Ask the user to confirm before leaving the current page
export default function usePageExitConfirmation(isViewingShared: boolean) {
  React.useEffect(() => {
    // Do not set the unsaved change confirmation when viewing a shared network
    if (isViewingShared) return

    // Add the listener to the page when the component using this hook mounts
    window.addEventListener("beforeunload", handleBeforeUnload)

    // Clean-up: remove the listener when the component using this hook unmounts
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isViewingShared])
}

function handleBeforeUnload(e: Event) {
  e.returnValue = true
}
