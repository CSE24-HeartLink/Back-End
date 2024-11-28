const Chat = require("../models/Chat");
const Cloi = require("../models/Cloi");

exports.saveChat = async (req, res) => {
  try {
    const { userId, messages } = req.body;

    // 클로이 찾기
    const cloi = await Cloi.findOne({ userId });
    if (!cloi) {
      return res.status(404).json({ error: "클로이를 찾을 수 없습니다." });
    }

    // 채팅 찾기 또는 생성
    let chat = await Chat.findOne({ userId });
    if (!chat) {
      chat = new Chat({
        userId,
        cloiId: cloi._id,
        messages: [],
      });
    }

    // messages 배열의 모든 메시지를 저장 (user와 assistant 모두)
    if (Array.isArray(messages)) {
      messages.forEach((message) => {
        chat.messages.push({
          role: message.role,
          content: message.content,
          timestamp: new Date(),
        });
      });
    }

    chat.lastInteractionAt = new Date();
    await chat.save();

    res.json(chat);
  } catch (error) {
    console.error("채팅 저장 오류:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getChats = async (req, res) => {
  try {
    const { userId } = req.params;
    const chat = await Chat.findOne({ userId })
      .populate("cloiId", "name level")
      .sort({ "messages.timestamp": -1 });

    if (!chat) {
      return res.json({ messages: [] });
    }

    // 메시지를 시간순으로 정렬하여 반환
    const sortedMessages = chat.messages.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    res.json({
      messages: sortedMessages,
      cloiInfo: chat.cloiId,
    });
  } catch (error) {
    console.error("채팅 조회 오류:", error);
    res.status(500).json({ error: error.message });
  }
};
