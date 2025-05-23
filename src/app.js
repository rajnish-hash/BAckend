import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app =express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))
 // json data
app.use(express.json({
    limit:"16kb"}))


// url encoded data
app.use(express.urlencoded({
    extended:true,limit:"16kb"
}))

// store file data
app.use(express.static("public"))

// cookie parser
app.use(cookieParser())




// import routes 

import userRouter from './routes/user.routes.js'

// routes declaration

app.use("/api/v1/users",userRouter)











export default app
// export { app}