// routes/feedRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Feed = require('../models/Feed');
const Comment = require('../models/Comment');

// Feed routes
router.get('/all', async (req, res) => {
  try {
    const feeds = await Feed.find();
    res.status(200).json(feeds);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const feeds = await Feed.find({ userId });
    res.status(200).json(feeds);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, content, image } = req.body;
    const feed = new Feed({ userId, content, image });
    await feed.save();
    res.status(201).json(feed);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add more feed-related routes here

module.exports = router;
