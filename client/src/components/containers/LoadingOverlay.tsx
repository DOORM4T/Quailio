import { Layer } from "grommet"
import React from "react"
import { useSelector } from "react-redux"
import Spinner from "react-spinner"
import "react-spinner/react-spinner.css"
import getIsLoading from "../../store/selectors/getIsLoading"

const LoadingOverlay: React.FC = () => {
  const isLoading = useSelector(getIsLoading)

  if (!isLoading) return null

  return (
    <Layer style={{ backgroundColor: "transparent" }}>
      <Spinner />
    </Layer>
  )
}

export default LoadingOverlay
