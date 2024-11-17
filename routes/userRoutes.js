const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { User, Feed, Comment } = require('../models');

// 특정 사용자의 총 댓글 수 조회
router.get('/users/:userId/comments/count', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 사용자 존재 여부 확인
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    const commentCount = await Comment.countDocuments({ 
      userId,
      status: { $ne: 'deleted' } // 삭제되지 않은 댓글만 카운트
    });
    
    res.status(200).json({ 
      userId,
      nickname: user.nickname,
      commentCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 특정 사용자의 총 게시글 수 조회
router.get('/users/:userId/feeds/count', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 사용자 존재 여부 확인
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    const feedCount = await Feed.countDocuments({ 
      userId,
      status: 'active' // 활성 상태인 게시글만 카운트
    });
    
    res.status(200).json({ 
      userId,
      nickname: user.nickname,
      feedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 사용자 검색
router.get('/users/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: '검색어를 입력해주세요.' });
    }
    
    if (query.length < 2) {
      return res.status(400).json({ error: '검색어는 2글자 이상이어야 합니다.' });
    }
    
    // nickname 또는 fullname으로 검색
    const users = await User.find({
      $or: [
        { nickname: { $regex: query, $options: 'i' }},
        { fullname: { $regex: query, $options: 'i' }}
      ]
    })
    .select('userId nickname fullname profileImage')
    .limit(20);
    
    // 검색 결과가 없는 경우
    if (users.length === 0) {
      return res.status(404).json({
        message: '검색 결과가 없습니다.',
        query,
        users: [],
        count: 0
      });
    }
    
    // 검색 결과가 있는 경우
    res.status(200).json({ 
      message: '검색 성공',
      query,
      users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// // 사용자 검색
// router.get('/users/search', async (req, res) => {
//   try {
//     const { query } = req.query;
    
//     if (!query) {
//       return res.status(400).json({ error: '검색어를 입력해주세요.' });
//     }
    
//     if (query.length < 2) {
//       return res.status(400).json({ error: '검색어는 2글자 이상이어야 합니다.' });
//     }
    
//     // nickname 또는 fullname으로 검색
//     const users = await User.find({
//       $or: [
//         { nickname: { $regex: query, $options: 'i' }},
//         { fullname: { $regex: query, $options: 'i' }}
//       ]
//     })
//     .select('userId nickname fullname profileImage') // 필요한 필드만 선택
//     .limit(20); // 검색 결과 제한
    
//     res.status(200).json({ 
//       query,
//       users,
//       count: users.length
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

module.exports = router;