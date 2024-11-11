const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const friendRequestSchema = new Schema({
    fromId: { type: String, ref: 'User', required: true },
  toId: { type: String, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

const FriendRequest = mongoose.model('friendRequest', friendRequestSchema, 'friendRequests');
module.exports = FriendRequest;