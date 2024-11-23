const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const {
  Feed,
  Comment,
  User,
  FriendList,
  Notification,
  Cloi,
} = require("../models");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
const notificationService = require("../services/notificationService");
const { calculateLevel } = require("./cloiRoutes");

// S3 클라이언트 설정
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

// S3 업로드 설정
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,
    key: function (req, file, cb) {
      cb(null, `feeds/${Date.now()}_${file.originalname}`);
    },
  }),
});

//전체 피드 불러오기
// feed 라우터에서 populate 필드 수정
router.get("/", async (req, res) => {
  try {
    const { currentUserId } = req.query; // 현재 로그인한 사용자 ID

    // 1. 사용자의 친구 목록 가져오기
    const friendships = await FriendList.find({
      userId: currentUserId,
      status: "active",
    });

    // 2. 친구 ID 목록 만들기 (자신 포함)
    const friendIds = friendships.map((f) => f.friendId);
    friendIds.push(currentUserId); // 자신의 피드도 포함

    // 3. 친구들의 피드만 가져오기
    const feeds = await Feed.find({
      userId: { $in: friendIds },
      status: "active",
    })
      .populate("userId", "email nickname profileImage")
      .sort({ createdAt: -1 });

    res.json(feeds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 그룹 피드 불러오기
router.get("/group/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const feeds = await Feed.find({
      groupId,
      status: "active",
    })
      .populate("userId", "nickname profileImage")
      .sort({ createdAt: -1 });
    res.status(200).json({ feeds });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 단일 피드 조회
router.get("/:feedId", async (req, res) => {
  try {
    const { feedId } = req.params;
    const feed = await Feed.findOne({ feedId, status: "active" }).populate(
      "userId",
      "nickname profileImage"
    );

    if (!feed) {
      return res.status(404).json({ error: "피드를 찾을 수 없습니다." });
    }

    res.status(200).json({ feed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 특정 사용자 게시물 불러오기
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentUserId } = req.query;

    // 자신의 피드이거나 친구인 경우만 조회 가능
    if (userId !== currentUserId) {
      const isFriend = await FriendList.findOne({
        userId: currentUserId,
        friendId: userId,
        status: "active",
      });

      if (!isFriend) {
        return res.status(200).json({ feeds: [] });
      }
    }

    const feeds = await Feed.find({
      userId,
      status: "active",
    })
      .populate("userId", "nickname profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({ feeds });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 피드 작성
router.post("/", upload.array("files", 5), async (req, res) => {
  try {
    const { userId, content, groupId, emotion } = req.body;

    // 이미지 URL 배열 생성
    const images = req.files
      ? req.files.map((file) => ({
          url: file.location,
          isAIGenerated: false,
        }))
      : [];

    const feed = new Feed({
      feedId: uuidv4(),
      userId,
      content,
      groupId,
      emotion,
      images,
      status: "active",
      commentCount: 0,
    });

    await feed.save();

    // 클로이 성장 체크
    const cloi = await Cloi.findOne({ userId });
    if (cloi) {
      cloi.feedCount += 1;
      const newLevel = calculateLevel(cloi.feedCount, cloi.commentCount);
      cloi.level = newLevel;
      await cloi.save();
    }

    const populatedFeed = await Feed.findOne({ feedId: feed.feedId }).populate(
      "userId",
      "nickname profileImage"
    );

    res.status(201).json({ feed: populatedFeed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 피드 수정
router.put("/:feedId", async (req, res) => {
  try {
    const { feedId } = req.params;
    const { content, emotion } = req.body;

    const feed = await Feed.findOne({ feedId, status: "active" });
    if (!feed) {
      return res.status(404).json({ error: "피드를 찾을 수 없습니다." });
    }

    feed.content = content;
    feed.emotion = emotion;
    feed.updatedAt = new Date();
    await feed.save();

    const updatedFeed = await Feed.findOne({ feedId }).populate(
      "userId",
      "nickname profileImage"
    );

    res.status(200).json({ feed: updatedFeed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//피드 삭제
router.delete("/:feedId", async (req, res) => {
  try {
    const { feedId } = req.params;

    const feed = await Feed.findOne({ feedId });
    if (!feed) {
      return res.status(404).json({ error: "피드를 찾을 수 없습니다." });
    }

    // 이미지가 있는 경우 S3에서 삭제
    if (feed.images && feed.images.length > 0) {
      for (const image of feed.images) {
        const key = image.url.split("/").slice(-2).join("/");
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
          })
        );
      }
    }

    // DB에서 완전 삭제
    await Feed.findOneAndDelete({ feedId });
    // 혹은 await feed.remove();
    //     // soft delete 처리
    //     feed.status = "deleted";
    //     feed.updatedAt = new Date();
    //     await feed.save();

    //     res.status(204).send();
    //   } catch (error) {
    //     res.status(500).json({ error: error.message });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 댓글 불러오기
router.get("/:feedId/comments", async (req, res) => {
  try {
    const { feedId } = req.params;
    const comments = await Comment.find({ feedId })
      .populate("userId", "nickname profileImage")
      .sort({ createdAt: 1 });

    res.status(200).json({ comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 댓글 작성
router.post("/:feedId/comment", async (req, res) => {
  try {
    const { feedId } = req.params;
    const { userId, content } = req.body;

    console.log("1. 데이터 받음");

    const feed = await Feed.findOne({ feedId, status: "active" });
    console.log("2. 피드 찾음");

    //댓글 생성
    const comment = new Comment({
      commentId: Math.random().toString(36).substr(2, 9), // 임시 ID 생성
      feedId,
      userId,
      content,
    });
    //댓글 저장
    await comment.save();

    // 피드 작성자에게 알림 생성 (자신의 피드에 댓글을 달 경우 제외)
    if (feed.userId.toString() !== userId.toString()) {
      const commentUser = await User.findById(userId);
      const notification = new Notification({
        userId: feed.userId,
        triggeredBy: userId,
        message: `${commentUser.nickname}님이 회원님의 게시물에 댓글을 달았습니다.`,
        type: "comment",
        reference: {
          feedId: feedId, // feedId 그대로 사용
          commentId: comment._id, // 댓글 ID
        },
      });

      await notification.save();
    }
    //댓글 수 증가
    feed.commentCount += 1;
    await feed.save();

    // 클로이 성장 체크
    const cloi = await Cloi.findOne({ userId });
    if (cloi) {
      cloi.commentCount += 1;
      const newLevel = calculateLevel(cloi.feedCount, cloi.commentCount);
      cloi.level = newLevel;
      await cloi.save();
    }

    const populatedComment = await Comment.findById(comment._id).populate(
      "userId",
      "nickname profileImage"
    );

    res.status(201).json({ comment: populatedComment });
  } catch (error) {
    console.error("댓글 작성 에러:", error);
    res.status(500).json({ error: error.message });
  }
});

// 댓글 삭제
router.delete("/:feedId/comment/:commentId", async (req, res) => {
  try {
    const { feedId, commentId } = req.params;

    // 댓글이 존재하는지 확인
    const comment = await Comment.findOne({ commentId });
    if (!comment) {
      return res.status(404).json({ error: "댓글을 찾을 수 없습니다." });
    }

    // 피드 확인
    const feed = await Feed.findOne({ feedId });
    if (!feed) {
      return res.status(404).json({ error: "피드를 찾을 수 없습니다." });
    }

    // 댓글 삭제
    await Comment.findOneAndDelete({ commentId });

    // 댓글 수 감소
    feed.commentCount = Math.max(0, feed.commentCount - 1);
    await feed.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("댓글 삭제 에러:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
