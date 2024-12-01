// groupRoutes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Group, FriendList, Feed } = require("../../models");

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

//그룹 피드 가져오기
router.get("/group/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { type } = req.query;

    // 1. 그룹과 멤버 조회
    const group = await Group.findOne({
      groupId,
      status: "active",
    });

    if (!group) {
      return res.status(404).json({ error: "그룹을 찾을 수 없습니다." });
    }

    // 2. 그룹 피드 쿼리 조건 설정
    let query = {
      $and: [
        {
          $or: [
            // 해당 그룹에 속한 피드
            { groupId },
            // 그룹 멤버의 피드 중 이 그룹에 속한 것만
            {
              userId: { $in: group.members },
              groupId,
            },
          ],
        },
        { status: "active" },
      ],
    };

    // 3. 앨범 타입인 경우 이미지가 있는 피드만 필터링
    if (type === "album") {
      query["images.0"] = { $exists: true };
    }

    const feeds = await Feed.find(query)
      .populate("userId", "nickname profileImage")
      .sort({ createdAt: -1 });

    // 4. 앨범 타입인 경우 AI 생성 이미지 제외
    if (type === "album") {
      feeds.forEach((feed) => {
        feed.images = feed.images.filter((img) => !img.isAIGenerated);
      });
    }

    res.status(200).json({ feeds });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
  // 트랜잭션 시작
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { groupId } = req.params;

    // 1. 그룹 상태 변경
    const group = await Group.findOneAndUpdate(
      { groupId, status: "active" },
      { status: "deleted" },
      { new: true, session }
    );

    if (!group) {
      throw new Error("그룹을 찾을 수 없습니다.");
    }

    // 2. 해당 그룹의 피드들 상태 변경
    await Feed.updateMany(
      { groupId: groupId, status: "active" },
      { status: "deleted" },
      { session }
    );

    // 모든 작업이 성공하면 트랜잭션 커밋(실패시 롤백)
    await session.commitTransaction();
    res.status(204).send();
  } catch (error) {
    // 에러 발생 시 모든 변경사항 롤백
    await session.abortTransaction();
    console.error("Error deleting group:", error);
    res.status(500).json({ error: "그룹 삭제에 실패했습니다." });
  } finally {
    // 세션 종료
    session.endSession();
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

// 그룹 멤버 이동 (또는 그룹에서 제거)
router.put("/:groupId/move-member", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { groupId } = req.params;
    const { friendId, requesterId } = req.body;

    // 친구 정보 확인
    const friendInfo = await FriendList.findOne({
      userId: requesterId,
      friendId: friendId,
      status: "active",
    }).session(session);

    if (!friendInfo) {
      throw new Error("친구 정보를 찾을 수 없습니다.");
    }

    // groupId가 'null'이나 null이면 그룹에서 제거만 하고 새 그룹 추가는 하지 않음
    if (groupId === "null" || !groupId) {
      // 현재 소속된 그룹이 있다면 제거
      if (friendInfo.group) {
        const currentGroup = await Group.findOne({
          groupId: friendInfo.group,
          status: "active",
        }).session(session);

        if (currentGroup) {
          currentGroup.members = currentGroup.members.filter(
            (member) => member.toString() !== friendId
          );
          await currentGroup.save({ session });
        }

        // FriendList의 group 필드를 null로 설정
        friendInfo.group = null;
        await friendInfo.save({ session });
      }
    } else {
      // 특정 그룹으로 이동
      const newGroup = await Group.findOne({
        groupId,
        createdBy: requesterId,
        status: "active",
      }).session(session);

      if (!newGroup) {
        throw new Error("이동할 그룹을 찾을 수 없습니다.");
      }

      if (friendInfo.group && friendInfo.group.toString() === groupId) {
        throw new Error("이미 해당 그룹에 속해있습니다.");
      }

      if (friendInfo.group) {
        const currentGroup = await Group.findOne({
          groupId: friendInfo.group,
          status: "active",
        }).session(session);

        if (currentGroup) {
          currentGroup.members = currentGroup.members.filter(
            (member) => member.toString() !== friendId
          );
          await currentGroup.save({ session });
        }
      }

      // 새 그룹에 멤버 추가
      newGroup.members.push(friendId);
      await newGroup.save({ session });

      // FriendList의 group 필드 업데이트
      friendInfo.group = groupId;
      await friendInfo.save({ session });
    }

    await session.commitTransaction();

    // 업데이트된 데이터 반환
    const updatedFriend = await FriendList.findOne({
      userId: requesterId,
      friendId: friendId,
    }).populate("friendId", "nickname profileImage");

    res.status(200).json({
      success: true,
      data: {
        friend: updatedFriend,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({
      success: false,
      error: error.message,
    });
  } finally {
    session.endSession();
  }
});

module.exports = router;
