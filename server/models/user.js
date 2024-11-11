const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
     userId: { type: String, unique: true, required: true },
  phoneNum: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  nickname: { type: String, required: true },
  fullname: { type: String, required: true },
  profileImage: String,
  signupAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
  tokens: [{
    token: String,
    device: String,
    createdAt: { type: Date, default: Date.now }
  }]
});

const User = mongoose.model('user', userSchema, 'users');
module.exports = User;