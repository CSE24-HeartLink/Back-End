const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const albumSchema = new Schema({
    groupId: { type: String, ref: 'Group', required: true },
  images: [{
    postId: { type: String, ref: 'Post' },
    imageUrl: String,
    uploadedBy: { type: String, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  aiCollages: [{
    imageUrl: String,
    createdAt: { type: Date, default: Date.now }
  }]
});

const Album = mongoose.model('album', albumSchema, 'albums');
module.exports = Album;