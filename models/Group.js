const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const groupSchema = new Schema({
    groupId: {
      type: String,
      unique: true,
      required: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    gName: {
      type: String,
      required: true,
      maxLength: 6,
    },
    createdBy: {
      type: String,
      ref: "User",
      default: "temp-user", // 임시 기본값 추가
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["active", "deleted"],
      default: "active",
    },
  });


module.exports = mongoose.model('Group', groupSchema);