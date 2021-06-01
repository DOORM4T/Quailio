import "core-js"
import React from "react"
import "react-app-polyfill/ie11"
import "react-app-polyfill/stable"
import ReactDOM from "react-dom"
import App from "./App"
import "./main.css"

ReactDOM.render(<App />, document.getElementById("root") as HTMLDivElement)
