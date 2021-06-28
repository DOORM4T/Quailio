import { Router } from "express"
import { getNetwork } from "../services/firebase/getNetwork"
const router = Router()

router.get("/api", (_, res) => {
  res.json({ message: "Welcome to the Quailio API!" })
})

router.get("/api/:networkId", async (req, res, next) => {
  const { networkId } = req.params
  try {
    const network = await getNetwork(networkId)
    return res.status(200).json(network)
  } catch (error) {
    return next(error)
  }
})

export default router
