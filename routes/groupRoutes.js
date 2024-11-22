// groupRoutes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Group, FriendList } = require("../models");

// 사용자의 그룹 목록 조회
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "사용자 ID가 필요합니다." });
    }

    const groups = await Group.find({
      createdBy: userId,
      status: "active",
    }).sort("-createdAt");

    const formattedGroups = groups.map((group) => ({
      id: group.groupId,
      name: group.gName,
      createdAt: group.createdAt,
    }));

    res.status(200).json({ groups: formattedGroups });
  } catch (error) {
    console.error("Error in GET /groups:", error);
    res.status(500).json({ error: "그룹 목록을 불러오는데 실패했습니다." });
  }
});

// 그룹 생성
router.post("/", async (req, res) => {
  try {
    const { name, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "사용자 ID가 필요합니다." });
    }

    const group = new Group({
      groupId: new mongoose.Types.ObjectId().toString(),
      gName: name,
      createdBy: userId,
    });

    await group.save();

    const formattedGroup = {
      id: group.groupId,
      name: group.gName,
      createdAt: group.createdAt,
    };

    res.status(201).json(formattedGroup);
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(400).json({ error: "그룹 생성에 실패했습니다." });
  }
});

// 그룹 수정
router.put("/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name } = req.body;

    if (name.length > 6) {
      return res
        .status(400)
        .json({ error: "그룹 이름은 6자를 초과할 수 없습니다." });
    }

    const group = await Group.findOneAndUpdate(
      { groupId, status: "active" },
      { gName: name },
      { new: true }
    );

    if (!group) {
      return res.status(404).json({ error: "그룹을 찾을 수 없습니다." });
    }

    const formattedGroup = {
      id: group.groupId,
      name: group.gName,
      createdAt: group.createdAt,
    };

    res.status(200).json(formattedGroup);
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({ error: "그룹 수정에 실패했습니다." });
  }
});

// 그룹 삭제
router.delete("/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findOneAndUpdate(
      { groupId, status: "active" },
      { status: "deleted" },
      { new: true }
    );

    if (!group) {
      return res.status(404).json({ error: "그룹을 찾을 수 없습니다." });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ error: "그룹 삭제에 실패했습니다." });
  }
});

//그룹 멤버 추가
router.post("/:groupId/members", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { friendId, requesterId } = req.body;

    console.log("1. Request Data:", {
      groupId,
      friendId,
      requesterId,
      friendIdType: typeof friendId,
      requesterIdType: typeof requesterId,
    });

    const group = await Group.findOne({
      groupId: groupId,
      createdBy: requesterId,
      status: "active",
    });

    if (!group) {
      return res.status(404).json({ error: "그룹을 찾을 수 없습니다." });
    }

    console.log("2. Found Group:", {
      groupId: group.groupId,
      members: group.members,
      membersTypes: group.members.map((m) => typeof m),
    });

    // members의 각 요소를 문자열로 변환하여 출력
    const memberStrings = group.members.map((m) => m.toString());
    console.log("3. Member Comparison:", {
      memberStrings,
      incomingFriendId: friendId,
      includes: memberStrings.includes(friendId),
    });

    // 중복 체크
    const isMember = group.members.some((memberId) => {
      const memberStr = memberId.toString();
      console.log("4. Comparing:", {
        memberId: memberStr,
        friendId,
        isEqual: memberStr === friendId,
      });
      return memberStr === friendId;
    });

    if (isMember) {
      return res.status(400).json({ error: "이미 그룹 멤버입니다." });
    }

    // 새 멤버 추가
    console.log("5. Adding new member");
    group.members.push(friendId);
    await group.save();

    // 결과 확인
    const updatedGroup = await Group.findOne({ groupId });
    console.log("6. Updated group members:", updatedGroup.members);

    const populatedGroup = await Group.findOne({ groupId }).populate(
      "members",
      "nickname profileImage"
    );

    const formattedGroup = {
      id: populatedGroup.groupId,
      name: populatedGroup.gName,
      createdAt: populatedGroup.createdAt,
      members: populatedGroup.members.map((member) => ({
        id: member._id,
        nickname: member.nickname,
        profileImage: member.profileImage,
      })),
    };

    res.status(201).json({
      success: true,
      group: formattedGroup,
    });
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({
      success: false,
      error: error.message || "멤버 추가에 실패했습니다.",
    });
  }
});

module.exports = router;
