const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// reactions를 위한 하위 스키마 정의
const reactionSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: String,
  emoji: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

//피드
const feedSchema = new Schema({
  feedId: { type: String, required: true, unique: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  content: { type: String, required: true },
  groupId: String,
  images: [{ url: String, isAIGenerated: Boolean }],
  status: { type: String, default: "active" },
  commentCount: { type: Number, default: 0 },
  // reactions를 subdocument 배열로 정의
  reactions: [reactionSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 인덱스 추가
feedSchema.index({ feedId: 1 });
feedSchema.index({ userId: 1 });
feedSchema.index({ groupId: 1 });
feedSchema.index({ status: 1 });

module.exports = mongoose.model("Feed", feedSchema);
