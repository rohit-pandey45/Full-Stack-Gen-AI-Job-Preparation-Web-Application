const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const errorHandler = require("./middlewares/error.middleware.js")
const app = express()

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

//app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/* using all the routes here */
// ✅ app.js

app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)
// Add this AFTER all routes
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ message: "Internal server error" });
// });

app.use(errorHandler);

module.exports = app