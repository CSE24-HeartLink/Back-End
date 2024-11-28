const Chat = require("../models/Chat");
const Cloi = require("../models/Cloi");

exports.saveChat = async (req, res) => {
  try {
    const { userId, messages } = req.body;

    const cloi = await Cloi.findOne({ userId });
    if (!cloi) {
      return res.status(404).json({ error: "클로이를 찾을 수 없습니다." });
    }

    let chat = await Chat.findOne({ userId });
    if (!chat) {
      chat = new Chat({
        userId,
        cloiId: cloi._id,
        messages: [],
      });
    }

    chat.messages.push(...messages);
    chat.lastInteractionAt = new Date();
    await chat.save();

    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getChats = async (req, res) => {
  try {
    const { userId } = req.params;
    const chat = await Chat.findOne({ userId })
      .populate("cloiId", "name level")
      .sort({ lastInteractionAt: -1 });

    res.json(chat || { messages: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
