// routes/friendRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const FriendList = require('../models/FriendList');
const Notification = require('../models/Notification');

// Friend routes
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({ nickname: { $regex: query, $options: 'i' } });
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    const friend = new FriendList({ userId, friendId, status: 'pending' });
    await friend.save();
    // Send notification to friendId
    await Notification.create({ userId: friendId, message: 'You have a new friend request' });
    res.status(201).json(friend);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const friend = await FriendList.findByIdAndUpdate(id, { status: 'accepted' }, { new: true });
    res.status(200).json(friend);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await FriendList.findByIdAndDelete(id);
    res.status(204).json();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;