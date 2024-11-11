const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    commentId: { type: String, unique: true, required: true },
  postId: { type: String, ref: 'Post', required: true },
  userId: { type: String, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['active', 'deleted'],
    default: 'active'
  }
});

const Comment = mongoose.model('comment', commentSchema, 'comments');
module.exports = Comment;