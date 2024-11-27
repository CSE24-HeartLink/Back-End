// routes/ai/imgRoutes.js
const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// multer 설정 - 텍스트 파일만 임시 저장
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    console.log("Received file:", file);
    cb(null, true);
  },
});

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// S3 클라이언트 초기화
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

// S3 업로드 함수
async function uploadToS3(imageBuffer, filename) {
  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `images/${filename}`,
    Body: imageBuffer,
    ContentType: "image/png",
  };

  try {
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);
    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/images/${filename}`;
  } catch (error) {
    throw error;
  }
}

// 이미지 생성 라우트
router.post("/generate-image", upload.single("text_file"), async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    let prompt;
    //text file 대신 입력내용
    if (req.file) {
      prompt = fs.readFileSync(req.file.path, "utf-8");
    } else if (req.body.text_content) {
      prompt = req.body.text_content;
    } else {
      return res.status(400).json({ error: "Text content is required" });
    }

    console.log("Prompt content:", prompt);
    console.log("Calling DALL-E with prompt...");

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });

    console.log("DALL-E response:", response);

    // 여기서 실제 응답을 클라이언트로 보냄
    res.json({
      success: true,
      data: response.data, // DALL-E 응답의 data 부분을 그대로 전달
    });
  } catch (error) {
    console.error("Detailed error:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
    });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
