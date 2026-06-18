const { Route } = require('express')
const authController = require("../controllers/auth.controllers.js")

const authRouter = Router()

authRouter.post("/register", authController.registerUserController)


module.exports = authRouter