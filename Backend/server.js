import express from "express"
import cors from "cors"
import { connectDB } from "./config/db.js"
import foodRouter from "./routes/foodRoute.js"


const app = express()
const port = 4000



//middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//db connection

connectDB();


//api endpoints
app.use('/api/food', foodRouter);
app.use("/images", express.static("uploads"))


app.get('/', (req, res) => {
  res.send('Server is working!')
})


app.listen(port, () => {
  console.log(`Server Started on http://localhost:${port}`)
})


