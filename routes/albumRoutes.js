const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Feed, Group } = require('../models');

// GET /api/groups/:groupId/album - 그룹 앨범 조회 (그룹 생성자만 가능)
router.get('/groups/:groupId/album', async (req, res) => {
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
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }

    // 해당 그룹의 모든 피드 이미지 조회
    const feeds = await Feed.find({ 
      groupId,
      status: 'active',
      'images.0': { $exists: true }
    })
    .sort('-createdAt')
    .select('images createdAt emotion userId');

    // 실제 사진만 추출 (AI 생성 이미지 제외)
    const albumImages = feeds.reduce((acc, feed) => {
      const naturalImages = feed.images
        .filter(img => !img.isAIGenerated)
        .map(img => ({
          url: img.url,
          createdAt: feed.createdAt,
          emotion: feed.emotion,
          userId: feed.userId
        }));
      return [...acc, ...naturalImages];
    }, []);

    res.status(200).json({ 
      images: albumImages,
      totalCount: albumImages.length,
      groupName: group.gName
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/groups/:groupId/request-collage - AI 콜라주 생성 요청
router.post('/groups/:groupId/request-collage', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    // 그룹 생성자 확인
    const group = await Group.findOne({ 
      groupId, 
      createdBy: userId,
      status: 'active' 
    });

    if (!group) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }

    // 그룹의 이미지 URL들을 수집 (최근 30일 이내의 이미지만)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const feeds = await Feed.find({ 
      groupId,
      status: 'active',
      createdAt: { $gte: thirtyDaysAgo },
      'images.0': { $exists: true }
    })
    .select('images');

    const imageUrls = feeds.reduce((acc, feed) => {
      const naturalImages = feed.images
        .filter(img => !img.isAIGenerated)
        .map(img => img.url);
      return [...acc, ...naturalImages];
    }, []);

    if (imageUrls.length < 2) {
      return res.status(400).json({ 
        error: '콜라주 생성을 위한 충분한 이미지가 없습니다. (최소 2개 이상 필요)' 
      });
    }

    // AI 서비스에 전달할 데이터 준비
    const requestData = {
      groupId,
      imageUrls,
      groupName: group.gName
    };

    res.status(200).json({ 
      message: '콜라주 생성이 요청되었습니다.',
      requestData  // AI 서비스에서 사용할 데이터
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;