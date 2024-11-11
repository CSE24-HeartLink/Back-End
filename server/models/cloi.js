const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cloiSchema = new Schema({
    userId: { type: String, ref: 'User', unique: true, required: true },
  level: { 
    type: Number, 
    default: 1,
    min: 1,
    max: 5
  },
  postCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  lastInteractionAt: { type: Date, default: Date.now }
});

const Cloi = mongoose.model('cloi', cloiSchema, 'Clois');
module.exports = Cloi;