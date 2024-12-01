const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { User, Notification } = require("../../models");

// FCM 토큰 등록/업데이트
router.post("/register-token", async (req, res) => {
  try {
    const { userId, fcmToken, device } = req.body;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 해당 기기의 토큰 업데이트 또는 추가
    const tokenIndex = user.tokens.findIndex((t) => t.device === device);
    if (tokenIndex !== -1) {
      user.tokens[tokenIndex].fcmToken = fcmToken;
    } else {
      user.tokens.push({
        token: "",
        device,
        fcmToken,
      });
    }

    await user.save();
    res.status(200).json({ message: "Token registered successfully" });
  } catch (error) {
    console.error("Error registering token:", error);
    res.status(500).json({ error: error.message });
  }
});

// 알림 조회
router.get("/:userId", async (req, res) => {
  try {
    console.log("Received userId:", req.params.userId); // userId 로그
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .populate("triggeredBy", "userId nickname profileImage"); // id, 닉네임, 프사

    console.log("Found notifications:", notifications); // 조회된 데이터 로그

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 읽지 않은 알림 개수
router.get("/unread/:userId", async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.params.userId,
      isRead: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 알림 생성 및 푸시알림 전송
router.post("/", async (req, res) => {
  try {
    const { userId, triggeredBy, message, type } = req.body;

    // DB에 알림 저장
    const notification = new Notification({
      userId,
      triggeredBy,
      message,
      type,
    });
    await notification.save();

    // 푸시알림 전송
    const recipient = await User.findOne({ userId });
    if (recipient && recipient.tokens.length > 0) {
      // 알림 타입별 제목 설정
      let title = "";
      switch (type) {
        case "friend_request":
          title = "새로운 친구 요청";
          break;
        case "comment":
          title = "새로운 댓글";
          break;
        case "level_up":
          title = "레벨 업!";
          break;
        case "etc":
          title = "새로운 알림";
          break;
      }

      // 모든 기기의 FCM 토큰 수집
      const fcmTokens = recipient.tokens
        .filter((t) => t.fcmToken)
        .map((t) => t.fcmToken);

      if (fcmTokens.length > 0) {
        const fcmMessage = {
          notification: {
            title,
            body: message,
          },
          data: {
            notificationId: notification._id.toString(),
            type,
            triggeredBy,
            createdAt: notification.createdAt.toISOString(),
          },
        };

        if (fcmTokens.length === 1) {
          // 단일 기기 전송
          fcmMessage.token = fcmTokens[0];
          await admin.messaging().send(fcmMessage);
        } else {
          // 다중 기기 전송
          fcmMessage.tokens = fcmTokens;
          await admin.messaging().sendMulticast(fcmMessage);
        }
      }
    }

    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: error.message });
  }
});

// 알림 읽음 처리
router.patch("/read/:notificationId", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.notificationId,
      { isRead: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 모든 알림 읽음 처리
router.patch("/read-all/:userId", async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.params.userId, isRead: false },
      { isRead: true }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 알림 삭제
router.delete("/:notificationId", async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.notificationId);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// //알림 토큰
// router.post("/register-token", async (req, res) => {
//   try {
//     const { userId, expoPushToken } = req.body;

//     const user = await User.findById(userId);
//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     // 기존 토큰이 있는지 확인
//     const existingToken = user.tokens.find(
//       (t) => t.expoPushToken === expoPushToken
//     );

//     if (!existingToken) {
//       // 새로운 토큰 추가
//       user.tokens.push({
//         token: "", // JWT 토큰은 로그인 시 생성됨
//         expoPushToken,
//       });
//       await user.save();
//     }

//     res.status(200).json({ success: true });
//   } catch (error) {
//     console.error("Token registration error:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

module.exports = router;
