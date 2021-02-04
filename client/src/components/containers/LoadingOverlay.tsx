import { Layer } from "grommet"
import React from "react"
import { useSelector } from "react-redux"
import Spinner from "react-spinner"
import "react-spinner/react-spinner.css"
import { IApplicationState } from "../../store/store"

const LoadingOverlay: React.FC = () => {
  const isLoading = useSelector<IApplicationState>(
    (state) =>
      state.auth.isLoading || state.networks.isLoading || state.ui.isLoading,
  ) as boolean

  if (!isLoading) return null

  return (
    <Layer style={{ backgroundColor: "transparent" }}>
      <Spinner />
    </Layer>
  )
}

export default LoadingOverlay
