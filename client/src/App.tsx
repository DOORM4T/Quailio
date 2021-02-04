import React from "react"
import { Grommet } from "grommet"
import { ThemeType } from "grommet/themes"

import Routes from "./Routes"
import { Provider } from "react-redux"
import { store } from "./store/store"
import LoadingOverlay from "./components/containers/LoadingOverlay"

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
        <LoadingOverlay />
      </Grommet>
    </Provider>
  )
}

export default App
