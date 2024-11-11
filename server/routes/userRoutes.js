// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Feed = require('../models/Feed');
const Comment = require('../models/Comment');

// User routes
router.get('/:userId/comments/count', async (req, res) => {
  try {
    const { userId } = req.params;
    const commentCount = await Comment.countDocuments({ userId });
    res.status(200).json({ commentCount });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:userId/feeds/count', async (req, res) => {
  try {
    const { userId } = req.params;
    const feedCount = await Feed.countDocuments({ userId });
    res.status(200).json({ feedCount });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({ nickname: { $regex: query, $options: 'i' } });
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;