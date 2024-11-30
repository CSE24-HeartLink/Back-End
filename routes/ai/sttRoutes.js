const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const upload = multer({ storage: multer.memoryStorage() });

// STT 음성-텍스트 변환 라우트
router.post('/', upload.single('file'), async (req, res) => {
    try {
        // 파일 체크
        if (!req.file) {
            return res.status(400).json({ error: '음성 파일이 필요합니다.' });
        }

        // FormData 생성
        const formData = new FormData();
        formData.append('audio_file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        // Python FastAPI 서버로 요청
        const response = await axios.post('http://localhost:8000/transcribe', formData, {
            headers: {
                ...formData.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        // 결과 반환
        res.json(response.data);

    } catch (error) {
        console.error('STT 처리 중 오류:', error);
        
        // 에러 응답 처리
        const errorMessage = error.response?.data?.error || error.message || '음성 처리 중 오류가 발생했습니다.';
        res.status(error.response?.status || 500).json({
            error: errorMessage
        });
    }
});

// STT 상태 확인 라우트
router.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'STT Service' });
});

module.exports = router;