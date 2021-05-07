import { Grommet } from "grommet"
import { ThemeType } from "grommet/themes"
import React from "react"
import { Provider } from "react-redux"
import LoadingOverlay from "./components/containers/LoadingOverlay"
import ShareNetworkOverlay from "./components/containers/ShareNetworkOverlay"
import ViewPersonOverlay from "./components/containers/ViewPersonOverlay"
import Routes from "./Routes"
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
  fileInput: {
    label: {
      size: "xlarge",
    },
    pad: "xlarge",
  },
}

function App() {
  return (
    <Provider store={store}>
      <Grommet theme={customTheme}>
        <Routes />
        <LoadingOverlay />
        <ViewPersonOverlay id="view-person-overlay" />
        <ShareNetworkOverlay id="sharing-overlay" />
      </Grommet>
    </Provider>
  )
}

export default App
