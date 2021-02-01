import React from "react"
import { Grommet } from "grommet"
import { ThemeType } from "grommet/themes"

import Routes from "./Routes"
import { Provider } from "react-redux"
import { store } from "./store/store"

const customTheme: ThemeType = {
  global: {
    colors: {
      brand: "#32858A",
      "accent-1": "#B1EACD",
    },
  },
  tip: {
    content: {
      background: "dark-1",
    },
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

/* Cypress testing: Attach the store to window when testing  */
const customWindow: Window & { [key: string]: any } = window
if (customWindow.Cypress) {
  customWindow.store = store
}
