// const dns = require("dns");
// dns.setDefaultResultOrder("ipv4first");

require("dotenv").config();

//console.log("MONGO_URI =", process.env.MONGO_URI);

const app = require("./src/app.js");
const connectToDB = require("./src/config/database.js");


connectToDB();
// invokeGeminiAi();


app.listen(3000, () => {
    console.log("Server is running on port 3000");
});