import { Grommet } from "grommet"
import { ThemeType } from "grommet/themes"
import React from "react"
import { Provider, useSelector } from "react-redux"
import LoadingOverlay from "./components/containers/LoadingOverlay"
import ViewPersonOverlay from "./components/containers/ViewPersonOverlay"
import Routes from "./Routes"
import { getIsOverlayOpen } from "./store/selectors/ui/getIsOverlayOpen"
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
        <LoadingOverlay />
        <ViewPersonOverlay id="view-person-overlay" />
      </Grommet>
    </Provider>
  )
}

export default App
