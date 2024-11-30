// routes/stt.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const upload = multer({ storage: multer.memoryStorage() });

const STT_API_URL = "http://localhost:8002";

router.post("/", upload.single("audio_file"), async (req, res) => {
  try {
    console.log("STT 라우트 호출됨");
    console.log("받은 파일 정보:", {
      fieldname: req.file?.fieldname,
      originalname: req.file?.originalname,
      mimetype: req.file?.mimetype,
      size: req.file?.size,
    });

    // 파일 체크
    if (!req.file) {
      console.log("파일이 없음");
      return res.status(400).json({ error: "음성 파일이 필요합니다." });
    }

    // FormData 생성
    const formData = new FormData();
    formData.append("audio_file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    console.log(
      "STT 서버로 요청 보내기:",
      `${STT_API_URL}/api/ai/stt/transcribe`
    );

    // Python FastAPI STT 서버로 요청
    const response = await axios.post(
      `${STT_API_URL}/api/ai/stt/transcribe`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    console.log("STT 서버 응답:", response.data);

    // 결과 반환
    res.json(response.data);
  } catch (error) {
    console.error("STT 처리 중 오류:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config,
    });

    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "음성 처리 중 오류가 발생했습니다.";
    res.status(error.response?.status || 500).json({
      error: errorMessage,
    });
  }
});

module.exports = router;
