import React from "react"
import { Grommet } from "grommet"
import { grommet } from "grommet/themes"

import Routes from "./Routes"

function App() {
  return (
    <Grommet theme={grommet}>
      <Routes />
    </Grommet>
  )
}

export default App
