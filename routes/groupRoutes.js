const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Group, GMember } = require("../models");

// 그룹 목록 조회
router.get("/", async (req, res) => {
  try {
    console.log("Receiving GET request for groups");
    const groups = await Group.find({ status: "active" });
    console.log("Found groups:", groups);

    const formattedGroups = groups.map((group) => ({
      id: group.groupId,
      name: group.gName,
      createdAt: group.createdAt,
    }));

    console.log("Sending formatted groups:", formattedGroups);
    res.status(200).json(formattedGroups);
  } catch (error) {
    console.error("Error in GET /groups:", error);
    res.status(500).json({ error: "그룹 목록을 불러오는데 실패했습니다." });
  }
});

// 그룹 생성
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    const group = new Group({
      groupId: new mongoose.Types.ObjectId().toString(),
      gName: name,
      createdBy: "temporary-user-id", // 임시 사용자 ID 설정
    });
    await group.save();
    res.status(201).json(group);
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

module.exports = router;
