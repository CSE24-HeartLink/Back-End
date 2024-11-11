const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gMemberSchema = new Schema({
    groupId: { type: String, ref: 'Group', required: true },
  userId: { type: String, ref: 'User', required: true },
  addedAt: { type: Date, default: Date.now }
});

const GMember = mongoose.model('gMember', gMemberSchema, 'gMembers');
module.exports = GMember;