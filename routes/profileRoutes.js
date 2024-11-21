const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { User, Feed } = require("../models");

// 다른 사용자의 프로필 조회 (검색해서 들어갈 때)
router.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId }).select(
      "userId nickname profileImage"
    ); // 다른 사용자는 기본 정보만 볼 수 있음

    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    // 공개 게시물 수 조회
    const feedCount = await Feed.countDocuments({
      userId,
      status: "active",
      groupId: { $exists: false }, // 개인 게시물만 카운트
    });

    res.status(200).json({
      profile: {
        userId: user.userId,
        nickname: user.nickname,
        profileImage: user.profileImage,
        feedCount,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 자신의 프로필 조회 (마이페이지)
router.get("/myprofile", async (req, res) => {
  try {
    const { userId } = req.query; // 현재 로그인한 사용자의 ID

    const user = await User.findOne({ userId }).select(
      "userId nickname fullname profileImage signupAt modifiedAt"
    );

    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    // 전체 게시물 수 조회 (개인 게시물)
    const feedCount = await Feed.countDocuments({
      userId,
      status: "active",
      groupId: { $exists: false },
    });

    // 작성한 댓글 수 조회
    const commentCount = await Comment.countDocuments({
      userId,
      status: "active", // active 상태인 댓글만 카운트
    });

    res.status(200).json({
      profile: {
        userId: user.userId,
        nickname: user.nickname,
        fullname: user.fullname,
        profileImage: user.profileImage,
        signupAt: user.signupAt,
        modifiedAt: user.modifiedAt,
        feedCount,
        commentCount,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 프로필(닉네임) 수정 - 자신의 프로필만 수정 가능
router.put("/myprofile", async (req, res) => {
  console.log("Request details:");
  console.log("Headers:", req.headers);
  console.log("Query params:", req.query);
  console.log("Request body:", req.body);
  console.log("Authorization header:", req.headers.authorization);
  try {
    const { userId } = req.query; // 현재 로그인한 사용자의 ID
    const { nickname } = req.body;

    if (!nickname || nickname.trim().length === 0) {
      return res.status(400).json({ error: "닉네임을 입력해주세요." });
    }

    // 이미 사용 중인 닉네임인지 확인
    const existingUser = await User.findOne({
      nickname,
      _id: { $ne: userId },
    });

    if (existingUser) {
      return res.status(400).json({ error: "이미 사용 중인 닉네임입니다." });
    }

    const user = await User.findOne({ _id: userId }); // _id로 변경
    console.log('Found user:', user);
    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    user.nickname = nickname;
    user.modifiedAt = new Date();
    await user.save();

    res.status(200).json({
      profile: {
        userId: user.userId,
        nickname: user.nickname,
        fullname: user.fullname,
        profileImage: user.profileImage,
        modifiedAt: user.modifiedAt,
      },
    });
  } catch (error) {
    console.error("Full error details:", error);
    res.status(500).json({ error: error.message });
  }
});

// 내 게시물 불러오기 (개인 게시물 보관함)
router.get("/myprofile/feeds", async (req, res) => {
  try {
    const { userId } = req.query; // 현재 로그인한 사용자의 ID
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const feeds = await Feed.find({
      userId,
      status: "active",
      groupId: { $exists: false },
    })
      .populate("userId", "nickname profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalFeeds = await Feed.countDocuments({
      userId,
      status: "active",
      groupId: { $exists: false },
    });

    res.status(200).json({
      feeds,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalFeeds / parseInt(limit)),
        totalFeeds,
        hasMore: totalFeeds > skip + feeds.length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;