const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const friendRequestSchema = new Schema({
    fromId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    group: { type: String, default: null }, // group 필드 추가
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
  });


module.exports = mongoose.model('FriendRequest', friendRequestSchema);