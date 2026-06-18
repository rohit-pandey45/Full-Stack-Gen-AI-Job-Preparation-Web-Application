const userModel = require("../models/user.model.js")

async function registerUserController(req,res) {

    const { username, email, password } = req.body

    if(!username || !email || !password){
        return res.status(400).json({
            message: "Please provide username, email and password"
        })
    }

    

 }

module.exports = {
    registerUserController
}