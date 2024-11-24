const express = require('express');
const router = require('express').Router();

router.use('/img', require('./imgRoutes'));
router.use('/stt', require('./sttRoutes'));
router.use('/chatbot', require('./chatbotRoutes'));

module.exports = router;