const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const friendListSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  friendId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // String -> ObjectId로 변경
  group: { type: String, ref: "Group", default: null }, // group 필드 추가해야 그룹이동 가능
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["active", "deleted"],
    default: "active",
  },
});

module.exports = mongoose.model("FriendList", friendListSchema);
