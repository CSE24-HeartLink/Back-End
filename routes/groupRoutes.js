const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Group, GMember, FriendList } = require('../models');
const { v4: uuidv4 } = require('uuid');

// GET /api/groups - 사용자가 생성한 그룹 목록 조회
router.get('/groups', async (req, res) => {
  try {
    const { userId } = req.query;
    
    // 사용자가 생성한 active 상태의 그룹만 조회
    const groups = await Group.find({
      createdBy: userId,
      status: 'active'
    }).sort('-createdAt');
    
    res.status(200).json({ groups });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/groups - 그룹 생성
router.post('/groups', async (req, res) => {
  try {
    const { gName, createdBy } = req.body;
    
    if (gName.length > 6) {
      return res.status(400).json({ error: '그룹 이름은 6자를 초과할 수 없습니다.' });
    }
    
    const group = new Group({
      groupId: uuidv4(),
      gName,
      createdBy,
      status: 'active'
    });
    
    await group.save();
    
    // 그룹 생성자를 멤버로 추가
    await GMember.create({
      groupId: group.groupId,
      userId: createdBy
    });
    
    res.status(201).json({ group });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/groups/:groupId - 그룹 이름 수정
router.put('/groups/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { gName, userId } = req.body;
    
    if (gName.length > 6) {
      return res.status(400).json({ error: '그룹 이름은 6자를 초과할 수 없습니다.' });
    }
    
    const group = await Group.findOne({ 
      groupId, 
      createdBy: userId,
      status: 'active' 
    });
    
    if (!group) {
      return res.status(404).json({ error: '그룹을 찾을 수 없습니다.' });
    }
    
    group.gName = gName;
    await group.save();
    
    res.status(200).json({ group });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/groups/:groupId/members - 그룹 멤버 조회 (그룹 생성자만 조회 가능)
router.get('/groups/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.query;
    
    // 그룹 생성자 확인
    const group = await Group.findOne({ 
      groupId, 
      createdBy: userId,
      status: 'active' 
    });
    
    if (!group) {
      return res.status(404).json({ error: '그룹을 찾을 수 없습니다.' });
    }
    
    const members = await GMember.find({ groupId })
      .populate('userId', 'nickname profileImage')
      .sort('addedAt');
    
    res.status(200).json({ members });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/groups/:groupId/members - 그룹에 멤버 추가
router.post('/groups/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, addedBy } = req.body;
    
    // 그룹 생성자 확인
    const group = await Group.findOne({ 
      groupId, 
      createdBy: addedBy,
      status: 'active' 
    });
    
    if (!group) {
      return res.status(404).json({ error: '그룹을 찾을 수 없습니다.' });
    }
    
    // 추가하려는 사용자가 친구인지 확인
    const isFriend = await FriendList.findOne({
      userId: addedBy,
      friendId: userId,
      status: 'active'
    });
    
    if (!isFriend) {
      return res.status(400).json({ error: '친구 관계인 사용자만 그룹에 추가할 수 있습니다.' });
    }
    
    // 이미 그룹 멤버인지 확인
    const existingMember = await GMember.findOne({ groupId, userId });
    if (existingMember) {
      return res.status(400).json({ error: '이미 그룹 멤버입니다.' });
    }
    
    const member = await GMember.create({ groupId, userId });
    
    res.status(201).json({ member });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/groups/:groupId/members/:userId - 그룹에서 멤버 삭제
router.delete('/groups/:groupId/members/:userId', async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { requestedBy } = req.body;
    
    // 그룹 생성자 확인
    const group = await Group.findOne({ 
      groupId, 
      createdBy: requestedBy,
      status: 'active' 
    });
    
    if (!group) {
      return res.status(404).json({ error: '그룹을 찾을 수 없습니다.' });
    }
    
    // 멤버 삭제
    await GMember.findOneAndDelete({ groupId, userId });
    
    // 남은 멤버 수 확인 (생성자 제외)
    const remainingMembers = await GMember.countDocuments({ 
      groupId,
      userId: { $ne: requestedBy }  // 생성자 제외
    });
    
    // 생성자 외 멤버가 없으면 그룹 삭제
    if (remainingMembers === 0) {
      group.status = 'deleted';
      await group.save();
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;