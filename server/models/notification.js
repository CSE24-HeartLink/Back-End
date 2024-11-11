const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    userId: { type: String, ref: 'User', required: true },
  triggeredBy: { type: String, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['friend_request', 'comment', 'level_up', 'etc'],
    required: true
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('notification', notificationSchema, 'notifications');
module.exports = Notification;