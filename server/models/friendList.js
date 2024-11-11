const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const friendListSchema = new Schema({
    userId: { type: String, ref: 'User', required: true },
  friendId: { type: String, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['active', 'deleted'],
    default: 'active'
  }
});

const FriendList = mongoose.model('friendList', friendListSchema, 'friendLists');
module.exports = FriendList;