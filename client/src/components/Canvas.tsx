import React from "react"
import { Box } from "grommet"
import { CSSProperties } from "styled-components"

const Canvas = React.forwardRef((props: IProps, ref: HTMLDivElement | any) => {
  return <Box id={props.id} ref={ref} align="center" style={props.style} />
})

export default Canvas

// ==- TYPE DEFINITIONS -== //
interface IProps {
  style?: CSSProperties
  id: string
}
