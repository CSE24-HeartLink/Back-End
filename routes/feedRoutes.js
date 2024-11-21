const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Feed, Comment } = require("../models");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
const notificationService = require("../services/notificationService");

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
    const feeds = await Feed.find()
      .populate("userId", "email nickname profileImage") // nickname과 profileImage 필드 추가
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
    const feeds = await Feed.find({
      userId,
      status: "active",
      groupId: { $exists: false }, // 그룹 피드 제외
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

    const comment = new Comment({
      commentId: Math.random().toString(36).substr(2, 9), // 임시 ID 생성
      feedId,
      userId,
      content,
    });

    console.log("3. 댓글 생성:", comment);

    await comment.save();
    console.log("4. 댓글 저장 성공");

    feed.commentCount += 1;
    await feed.save();
    console.log("5. 피드 업데이트 성공");

    const populatedComment = await Comment.findById(comment._id).populate(
      "userId",
      "nickname profileImage"
    );
    console.log("6. 최종 댓글:", populatedComment);

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
