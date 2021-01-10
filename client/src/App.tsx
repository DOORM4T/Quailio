import React from "react"
import { Grommet } from "grommet"
import { grommet, ThemeType } from "grommet/themes"

import Routes from "./Routes"
import { Provider } from "react-redux"
import configureStore from "./store/store"

const customTheme: ThemeType = {
  global: {
    colors: {},
  },
}

const store = configureStore()

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
