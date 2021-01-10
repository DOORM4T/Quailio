import React from "react"
import { Grommet } from "grommet"
import { ThemeType } from "grommet/themes"

import Routes from "./Routes"
import { Provider } from "react-redux"
import { store } from "./store/store"

const customTheme: ThemeType = {
  global: {
    colors: {},
  },
}

function App() {
  return (
    <Provider store={store}>
      <Grommet theme={customTheme}>
        <Routes />
      </Grommet>
    </Provider>
  )
}

export default App
