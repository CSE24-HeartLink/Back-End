const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const feedSchema = new Schema({
    feedId: { type: String, required: true, unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId, //String 대신 ObjectId 사용
      required: true,
      ref: "User",
    },
    content: { type: String, required: true },
    groupId: String,
    emotion: String,
    images: [{ url: String, isAIGenerated: Boolean }],
    status: { type: String, default: "active" },
    commentCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  });
  
  // 인덱스 추가
  feedSchema.index({ feedId: 1 });
  feedSchema.index({ userId: 1 });
  feedSchema.index({ groupId: 1 });
  feedSchema.index({ status: 1 });


module.exports = mongoose.model('Feed', feedSchema);