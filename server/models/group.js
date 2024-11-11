const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupSchema = new Schema({
    groupId: { type: String, unique: true, required: true },
  gName: { 
    type: String,
    required: true,
    maxLength: 6
  },
  createdBy: { type: String, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['active', 'deleted'],
    default: 'active'
  }
});

const Group = mongoose.model('group', groupSchema, 'groups');
module.exports = Group;