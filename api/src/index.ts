import dotenv from "dotenv"
dotenv.config()

import { app } from "./server"

const PORT = process.env.PORT || 3001

app.listen(PORT, _handleListen)

function _handleListen() {
  console.log(`API running on port ${PORT}...`)
}
