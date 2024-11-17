const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { User, FriendRequest, FriendList, Notification } = require('../models');
const notificationService = require('../services/notificationService');

// GET /api/users/search - 사용자 검색
router.get('/users/search', async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({ 
      nickname: { $regex: query, $options: 'i' }
    }).select('nickname profileImage');
    
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/friends/request - 친구 요청 보내기
router.post('/friends/request', async (req, res) => {
  try {
    const { fromId, toId } = req.body;
    
    // 이미 친구 요청이 존재하는지 확인
    const existingRequest = await FriendRequest.findOne({
      fromId,
      toId,
      status: 'pending'
    });
    
    if (existingRequest) {
      return res.status(400).json({ error: '이미 친구 요청이 존재합니다.' });
    }
    
    // 이미 친구인지 확인
    const existingFriend = await FriendList.findOne({
      userId: fromId,
      friendId: toId,
      status: 'active'
    });
    
    if (existingFriend) {
      return res.status(400).json({ error: '이미 친구 관계입니다.' });
    }
    
    const friendRequest = new FriendRequest({
      fromId,
      toId,
      status: 'pending'
    });
    
    await friendRequest.save();
    //알림 보내기
    await notificationService.sendFriendRequestNotification(toId, fromId);
    
    res.status(201).json({ friendRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/friends/requests/received - 받은 친구 요청 목록
router.get('/friends/requests/received', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const requests = await FriendRequest.find({
      toId: userId,
      status: 'pending'
    })
    .populate('fromId', 'nickname profileImage')
    .sort('-createdAt');
    
    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/friends/requests/:requestId/response - 친구 요청 응답
router.put('/friends/requests/:requestId/response', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { response } = req.body; // 'accepted' or 'declined'
    
    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ error: '친구 요청을 찾을 수 없습니다.' });
    }
    
    if (response === 'accepted') {
      // 친구 관계 생성 (양방향)
      await FriendList.create([
        { 
          userId: friendRequest.fromId, 
          friendId: friendRequest.toId,
          status: 'active'
        },
        { 
          userId: friendRequest.toId, 
          friendId: friendRequest.fromId,
          status: 'active'
        }
      ]);
      //알림 생성
      await notificationService.sendFriendAcceptedNotification(friendRequest.fromId, friendRequest.toId);
    } 
    
    friendRequest.status = response;
    await friendRequest.save();
    
    res.status(200).json({ friendRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/friends - 친구 목록 조회
router.get('/friends', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const friends = await FriendList.find({ 
      userId,
      status: 'active'
    })
    .populate('friendId', 'nickname profileImage')
    .sort('-createdAt');
    
    res.status(200).json({ friends });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/friends/:friendId - 친구 삭제 (status를 deleted로 변경)
router.delete('/friends/:friendId', async (req, res) => {
  try {
    const { userId } = req.body;
    const { friendId } = req.params;
    
    // 양방향 친구 관계 status 업데이트
    await FriendList.updateMany(
      {
        $or: [
          { userId, friendId },
          { userId: friendId, friendId: userId }
        ]
      },
      { status: 'deleted' }
    );
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;