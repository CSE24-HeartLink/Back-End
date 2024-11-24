const mongoose = require("mongoose");

// Models 정의
const User = require('./User');
const Feed = require('./Feed');
const Cloi = require('./Cloi');
const Comment = require('./Comment');
const FriendList = require('./FriendList');
const FriendRequest = require('./FriendRequest');
const Group = require('./Group');
const Notification = require('./Notification');


module.exports = {
  User,
  Feed,
  Cloi,
  Comment,
  FriendList,
  FriendRequest,
  Group,
  Notification
};
