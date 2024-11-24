const express = require('express');
const router = express.Router();
const multer = require('multer');  // multer 임포트 추가
const upload = multer({ storage: multer.memoryStorage() });

// 여기에 라우트 핸들러들을 추가하세요
router.post('/', upload.single('file'), (req, res) => {
    // STT 처리 로직
});

module.exports = router;