const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  //triggeredBy: { type: String, ref: "User", required: true },
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["friend_request", "comment", "level_up", "etc", "reaction"],
    required: true,
  },
  isRead: { type: Boolean, default: false },
  reference: {
    // comment 참조용 reference
    feedId: String,
    commentId: mongoose.Schema.Types.ObjectId,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
