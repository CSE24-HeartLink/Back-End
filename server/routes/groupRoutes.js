// routes/groupRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Group = require('../models/Group');
const GMember = require('../models/GMember');

// Group routes
router.get('/', async (req, res) => {
  try {
    const groups = await Group.find();
    res.status(200).json(groups);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, ownerId } = req.body;
    const group = new Group({ name, ownerId });
    await group.save();
    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const group = await Group.findByIdAndUpdate(id, { name }, { new: true });
    res.status(200).json(group);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Group.findByIdAndDelete(id);
    res.status(204).json();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Group member routes
router.get('/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params;
    const members = await Member.find({ groupId });
    res.status(200).json(members);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const member = new Member({ groupId, userId });
    await member.save();
    res.status(201).json(member);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:groupId/members/:userId', async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    await Member.findOneAndDelete({ groupId, userId });
    res.status(204).json();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;