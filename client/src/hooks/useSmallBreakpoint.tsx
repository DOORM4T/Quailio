import { ResponsiveContext } from "grommet"
import { useContext } from "react"

/* Whether the responsive context is medium or smaller*/
const useSmallBreakpoint = () => {
  const size = useContext(ResponsiveContext)
  const doColumn = /(small\b)/.test(size) /* xsmall, small, medium */

  return doColumn
}

export default useSmallBreakpoint
