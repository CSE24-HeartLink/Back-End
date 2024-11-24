const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

// Python FastAPI 서버 주소 설정
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000'; // FastAPI 서버 포트에 맞게 수정

// 채팅 요청 처리 라우터
router.post('/chat', async (req, res) => {
    try {
        const { messages, stream = false } = req.body;

        // FastAPI 서버로 요청 보내기
        if (stream) {
            // 스트리밍 응답 처리
            const response = await axios({
                method: 'post',
                url: `${PYTHON_API_URL}/chat`,
                data: {
                    messages: messages,
                    stream: true
                },
                responseType: 'stream'
            });

            // 스트리밍 헤더 설정
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            // 스트림 데이터 전달
            response.data.on('data', (chunk) => {
                res.write(chunk);
            });

            response.data.on('end', () => {
                res.end();
            });

        } else {
            // 일반 응답 처리
            const response = await axios.post(`${PYTHON_API_URL}/chat`, {
                messages: messages,
                stream: false
            });

            res.json(response.data);
        }

    } catch (error) {
        console.error('Chatbot API Error:', error);
        res.status(500).json({
            error: '채팅 처리 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 채팅 상태 확인 엔드포인트
router.get('/status', async (req, res) => {
    try {
        const response = await axios.get(`${PYTHON_API_URL}/`);
        res.json({ status: 'online', details: response.data });
    } catch (error) {
        res.json({ status: 'offline', error: error.message });
    }
});

module.exports = router;