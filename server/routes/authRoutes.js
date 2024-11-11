// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const firebase = require('firebase');

// Firebase configuration
const firebaseConfig = {
  // Your Firebase configuration
};

firebase.initializeApp(firebaseConfig);

// Auth routes
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const userCredential = await firebase.auth().signInWithPhoneNumber(phoneNumber, password);
    res.status(200).json(userCredential);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add more auth routes here (register, password reset, etc.)

module.exports = router;