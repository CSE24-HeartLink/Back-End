// routes/ai/imgRoutes.js
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const AWS = require('aws-sdk');

// multer 설정 - 텍스트 파일만 임시 저장
const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only text files are allowed'));
    }
  }
});

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// S3 클라이언트 초기화
const s3 = new AWS.S3({
  region: process.env.AWS_REGION
});

// S3 업로드 함수
async function uploadToS3(imageBuffer, filename) {
  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `images/${filename}`,
    Body: imageBuffer,
    ContentType: 'image/png'
  };

  const result = await s3.upload(uploadParams).promise();
  return result.Location;
}

// 이미지 생성 라우트
router.post('/generate-image', upload.single('text_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Text file is required' });
    }

    // 파일 내용 읽기
    const prompt = fs.readFileSync(req.file.path, 'utf-8');
    
    // 임시 텍스트 파일 즉시 삭제
    fs.unlinkSync(req.file.path);
    
    // DALL-E로 이미지 생성
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      size: "1024x1024",
      quality: "standard",
      n: 1
    });

    const imageUrl = response.data[0].url;
    
    // 이미지 다운로드 및 S3 업로드
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);
    const filename = `generated_${Date.now()}.png`;
    const s3Url = await uploadToS3(imageBuffer, filename);

    res.json({
      dalle_url: imageUrl,  // DALL-E가 생성한 원본 URL
      s3_url: s3Url        // S3에 저장된 URL
    });

  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;