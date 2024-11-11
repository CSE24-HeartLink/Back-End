// routes/notifyRoutes.js
const express = require('express');
const router = express.Router();
const firebase = require('firebase');

// Notification routes
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId;
    const notifications = await firebase.firestore().collection('notifications').where('userId', '==', userId).get();
    res.status(200).json(notifications.docs.map((doc) => doc.data()));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, message } = req.body;
    await firebase.firestore().collection('notifications').add({ userId, message, createdAt: new Date() });
    res.status(201).json({ message: 'Notification created' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add more notification routes here

module.exports = router;