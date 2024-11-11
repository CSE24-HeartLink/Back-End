const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    postId: { type: String, unique: true, required: true },
  userId: { type: String, ref: 'User', required: true },
  content: { type: String, required: true },
  images: [{
    url: String,
    isAIGenerated: Boolean
  }],
  groupId: { type: String, ref: 'Group' },
  emotion: {
    type: String,
    enum: ['happy', 'sad', 'angry', 'surprised', 'neutral']
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['active', 'deleted'],
    default: 'active'
  },
  commentCount: { type: Number, default: 0 }
});

const Post = mongoose.model('post', postSchema, 'posts');
module.exports = Post;