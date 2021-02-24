import React from "react"

// Ask the user to confirm before leaving the current page
export default function usePageExitConfirmation() {
  React.useEffect(() => {
    // Add the listener to the page when the component using this hook mounts
    window.addEventListener("beforeunload", handleBeforeUnload)

    // Clean-up: remove the listener when the component using this hook unmounts
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])
}

function handleBeforeUnload(e: Event) {
  e.returnValue = true
}
