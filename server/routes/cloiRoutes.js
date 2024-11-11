// routes/cloiRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Cloi = require('../models/Cloi');

// Cloi routes
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const cloi = await Cloi.findOne({ userId });
    res.status(200).json(cloi);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { level, experience } = req.body;
    const cloi = await Cloi.findOneAndUpdate({ userId }, { level, experience }, { new: true });
    res.status(200).json(cloi);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:userId/interaction', async (req, res) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;
    // Handle Cloi interaction logic here
    res.status(201).json({ message: 'Cloi interaction recorded' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;