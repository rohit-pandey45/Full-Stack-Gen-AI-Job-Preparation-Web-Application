const mongoose = require("mongoose");

//blacklist.model.js

const blacklistTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: [true, "token is required to be added in blacklist"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, //  MongoDB auto-deletes document after 24 hours (matches JWT expiry)
  },
});
// Note: removed { timestamps: true } since we're managing createdAt manually

const tokenBlacklistModel = mongoose.model(
  "blacklistTokens",
  blacklistTokenSchema,
);

module.exports = tokenBlacklistModel;
