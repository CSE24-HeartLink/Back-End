// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Feed = require('../models/Feed');

// Profile routes
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { nickname } = req.body;
    const user = await User.findByIdAndUpdate(userId, { nickname }, { new: true });
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:userId/feeds', async (req, res) => {
  try {
    const { userId } = req.params;
    const feeds = await Feed.find({ userId });
    res.status(200).json(feeds);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;