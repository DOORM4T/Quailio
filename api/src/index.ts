import dotenv from "dotenv"
import { app } from "./server"

dotenv.config()
const PORT = process.env.API_PORT || 3001

app.listen(PORT, _handleListen)

function _handleListen() {
  console.log(`API running on port ${PORT}...`)
}
