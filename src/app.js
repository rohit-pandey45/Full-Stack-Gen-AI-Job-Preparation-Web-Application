const express = require("express")
const app = express()

//Middleware to allow reading the data from req.body 
//(a built-in middleware in Express that parses incoming requests with JSON payloads and makes the data available in req.body)
app.use(express.json())

/*Required routes */
const authRouter = require("./routes/auth.routes.js")
/*using all routes */
app.use("/api/auth", authRouter)



module.exports = app