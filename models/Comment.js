const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    commentId: { type: String, unique: true, required: true },
    feedId: { type: String, ref: "Feed", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["active", "deleted"],
      default: "active",
    },
  });


module.exports = mongoose.model('Comment', commentSchema);