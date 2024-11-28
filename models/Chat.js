const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const chatSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  cloiId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cloi",
    required: true,
  },
  messages: [messageSchema],
  lastInteractionAt: {
    type: Date,
    default: Date.now,
  },
});

chatSchema.index({ userId: 1, lastInteractionAt: -1 });

module.exports = mongoose.model("Chat", chatSchema);
