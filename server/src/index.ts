import express, { Express } from "express"
import { apiRoutes } from "./routes/apiRoutes"

const app: Express = express()
const port = 4000

app.use(express.json())
app.use("/api", apiRoutes)

// Start the server
app.listen(port, async () => {
    console.log(`Server is running on port ${port}`)
})