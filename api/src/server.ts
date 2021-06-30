import cors from "cors"
import express, { NextFunction, Response } from "express"
import routes from "./routes"

export const app = express()
app.use(cors())
app.use(routes)
app.use(errorHandler as any)

/**
 * Custom error handler based on http://expressjs.com/en/guide/error-handling.html
 */
function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error(err.stack)
  res.status(500).json({ message: err.message })
}
