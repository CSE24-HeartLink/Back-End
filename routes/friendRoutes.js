const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { User, FriendRequest, FriendList, Notification } = require("../models");

// GET /api/friends - 친구 목록 조회
router.get("/", async (req, res) => {
  try {
    const { userId, groupId } = req.query;

    let query = {
      userId,
      status: "active",
    };

    // groupId가 있고 'all'이 아닌 경우에만 그룹 필터 적용
    if (groupId && groupId !== "all") {
      query.group = groupId;
    }

    const friends = await FriendList.find(query)
      .populate("friendId", "nickname profileImage")
      .sort("-createdAt");

    res.status(200).json({ friends });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/friends/requests - 친구 요청 보내기
router.post("/requests", async (req, res) => {
  try {
    const { fromId, nickname } = req.body;
    console.log("Received friend request:", { fromId, nickname });

    // 닉네임으로 사용자 찾기
    const toUser = await User.findOne({ nickname });
    if (!toUser) {
      return res
        .status(404)
        .json({ error: "해당 닉네임의 사용자를 찾을 수 없습니다." });
    }

    const toId = toUser._id;

    if (fromId === toId.toString()) {
      return res
        .status(400)
        .json({ error: "자기 자신에게는 친구 요청을 보낼 수 없습니다." });
    }

    // 이미 친구 요청이 존재하는지 확인
    const existingRequest = await FriendRequest.findOne({
      fromId,
      toId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({ error: "이미 친구 요청이 존재합니다." });
    }

    // 이미 친구인지 확인
    const existingFriend = await FriendList.findOne({
      userId: fromId,
      friendId: toId,
      status: "active",
    });

    if (existingFriend) {
      return res.status(400).json({ error: "이미 친구 관계입니다." });
    }

    // 친구 요청 생성
    const friendRequest = new FriendRequest({
      fromId,
      toId,
      status: "pending",
    });

    await friendRequest.save();

    // 알림 생성
    const fromUser = await User.findById(fromId);
    const notification = new Notification({
      userId: toId,
      triggeredBy: fromId,
      message: `${fromUser.nickname}님이 친구 요청을 보냈습니다.`,
      type: "friend_request",
    });

    await notification.save();

    res.status(201).json({
      success: true,
      friendRequest: {
        id: friendRequest._id,
        fromId: friendRequest.fromId,
        toId: friendRequest.toId,
        status: friendRequest.status,
        createdAt: friendRequest.createdAt,
      },
    });
  } catch (error) {
    console.error("Friend request error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/friends/requests/:requestId/response - 친구 요청 응답
router.put("/requests/:notificationId/response", async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { response, groupId } = req.body;

    // 먼저 notification 찾기
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ error: "알림을 찾을 수 없습니다." });
    }

    // notification 정보로 friendRequest 찾기
    const friendRequest = await FriendRequest.findOne({
      fromId: notification.triggeredBy,
      toId: notification.userId,
      status: "pending",
    });

    if (!friendRequest) {
      return res.status(404).json({ error: "친구 요청을 찾을 수 없습니다." });
    }

    if (response === "accepted") {
      // 친구 관계 생성
      await FriendList.create([
        {
          userId: friendRequest.fromId,
          friendId: friendRequest.toId,
          group: groupId,
          status: "active",
        },
        {
          userId: friendRequest.toId,
          friendId: friendRequest.fromId,
          status: "active",
        },
      ]);
    }

    // 상태 업데이트
    friendRequest.status = response;
    await friendRequest.save();

    // notification 삭제
    await Notification.findByIdAndDelete(notificationId);

    res.status(200).json({
      success: true,
      friendRequest,
    });
  } catch (error) {
    console.error("Friend request response error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/friends/requests/:requestId/reject - 친구 요청 거절
router.put("/requests/:notificationId/reject", async (req, res) => {
  try {
    const { notificationId } = req.params;

    // 먼저 notification 찾기
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ error: "알림을 찾을 수 없습니다." });
    }

    // notification 정보로 friendRequest 찾기
    const friendRequest = await FriendRequest.findOne({
      fromId: notification.triggeredBy,
      toId: notification.userId,
      status: "pending",
    });

    if (!friendRequest) {
      return res.status(404).json({ error: "친구 요청을 찾을 수 없습니다." });
    }

    // friendRequest 상태를 'declined'로 업데이트
    friendRequest.status = "declined"; // 'rejected' 대신 'declined' 사용
    await friendRequest.save();

    // notification 삭제
    await Notification.findByIdAndDelete(notificationId);

    res.status(200).json({
      success: true,
      friendRequest,
    });
  } catch (error) {
    console.error("Friend request reject error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/friends/requests/received - 받은 친구 요청 목록
router.get("/requests/received", async (req, res) => {
  try {
    const { userId } = req.query;

    const requests = await FriendRequest.find({
      toId: userId,
      status: "pending",
    })
      .populate("fromId", "nickname profileImage")
      .sort("-createdAt");

    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/friends/:friendId - 친구 삭제 (status를 deleted로 변경)
router.delete("/:friendId", async (req, res) => {
  try {
    const { userId } = req.body;
    const { friendId } = req.params;

    const result = await FriendList.updateMany(
      {
        $or: [
          {
            userId: new mongoose.Types.ObjectId(userId),
            friendId: new mongoose.Types.ObjectId(friendId),
          },
          {
            userId: new mongoose.Types.ObjectId(friendId),
            friendId: new mongoose.Types.ObjectId(userId),
          },
        ],
        status: "active",
      },
      { status: "deleted" }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "친구 관계를 찾을 수 없습니다" });
    }

    res.status(200).json({
      success: true,
      message: "친구가 삭제되었습니다.",
      deletedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// //친구 그룹 이동
// router.put("/:friendId/group", async (req, res) => {
//   try {
//     const { friendId } = req.params;
//     const { groupId } = req.body;

//     const updatedFriend = await FriendList.findByIdAndUpdate(
//       friendId,
//       { group: groupId },
//       { new: true }
//     ).populate("friendId", "nickname profileImage");

//     if (!updatedFriend) {
//       return res.status(404).json({ error: "친구를 찾을 수 없습니다." });
//     }

//     res.status(200).json({
//       success: true,
//       friend: updatedFriend,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// });

module.exports = router;
