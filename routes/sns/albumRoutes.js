const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Feed, Group } = require('../../models');

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

    // 실제 사진 추출 
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


module.exports = router;