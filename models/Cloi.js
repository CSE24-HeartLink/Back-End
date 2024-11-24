const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cloiSchema = new Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    name: {
      type: String,
      default: "클로이",
      maxLength: 10,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
    feedCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    lastInteractionAt: { type: Date, default: Date.now },
  });


module.exports = mongoose.model('Cloi', cloiSchema);