const express = require("express");
const router = express.Router();
const axios = require("axios");
const { rateLimit } = require("express-rate-limit");
const chatController = require("../../controllers/chatController");

require("dotenv").config();

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

router.use(limiter);

router.post("/chat", async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_API_URL}/api/ai/chatbot/chat`, {
      messages: req.body.messages,
      stream: req.body.stream || false,
      temperature: req.body.temperature,
      max_tokens: req.body.max_tokens,
    });

    if (req.body.stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      response.data.pipe(res);
    } else {
      res.json(response.data);
    }
  } catch (error) {
    console.error("Chat API Error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "채팅 처리 중 오류가 발생했습니다.",
      details: error.message,
    });
  }
});

router.get("/health", async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_API_URL}/api/ai/chatbot/health`);
    res.json(response.data);
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});

router.post("/save", chatController.saveChat);
router.get("/:userId", chatController.getChats);

module.exports = router;
