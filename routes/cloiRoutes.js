const express = require('express');
const router = express.Router();
const { Feed, Comment, Cloi } = require('../models');
const notificationService = require('../services/notificationService');

// 레벨별 클로이 이미지/모습 정보
const CLOI_APPEARANCES = {
  1: {
    image: '/images/cloi/level1.png',
    expression: 'sleepy'  // 이미지에서 보이는 졸린 표정
  },
  2: {
    image: '/images/cloi/level2.png',
    expression: 'happy'   // 웃는 표정
  },
  3: {
    image: '/images/cloi/level3.png',
    expression: 'curious' // 궁금한 표정
  },
  4: {
    image: '/images/cloi/level4.png',
    expression: 'proud'   // 뿌듯한 표정
  },
  5: {
    image: '/images/cloi/level5.png',
    expression: 'loving'  // 애정 가득한 표정
  }
};

// 레벨 계산 함수
const calculateLevel = (feedCount, commentCount) => {
  const totalPoints = feedCount * 2 + commentCount; // 게시물 2점, 댓글 1점
  
  if (totalPoints >= 50) return 5;
  if (totalPoints >= 30) return 4;
  if (totalPoints >= 20) return 3;
  if (totalPoints >= 10) return 2;
  return 1;
};

// 1. 클로이 정보와 현재 모습 조회
router.get('/:userId', async (req, res) => {
  try {
    const cloi = await Cloi.findOne({ userId: req.params.userId });
    if (!cloi) {
      // 클로이가 없으면 새로 생성
      const newCloi = new Cloi({ userId: req.params.userId });
      await newCloi.save();
      return res.json({
        ...newCloi.toObject(),
        appearance: CLOI_APPEARANCES[1]
      });
    }

    // 현재 레벨에 맞는 외형 정보 포함해서 반환
    res.json({
      ...cloi.toObject(),
      appearance: CLOI_APPEARANCES[cloi.level]
    });
  } catch (error) {
    res.status(500).json({ message: '클로이 조회 중 오류가 발생했습니다.', error: error.message });
  }
});

// 2. 클로이와 대화하기
router.post('/:userId/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const { userId } = req.params;

    // 클로이 존재 확인 및 마지막 대화 시간 업데이트
    const cloi = await Cloi.findOneAndUpdate(
      { userId },
      { lastInteractionAt: new Date() },
      { new: true }
    );

    if (!cloi) {
      return res.status(404).json({ message: '클로이를 찾을 수 없습니다.' });
    }

    // 클로이 레벨에 따른 대화 응답 생성
    let response;
    switch (cloi.level) {
      case 1:
        response = "응... (아직 말을 잘 못해요)";
        break;
      case 2:
        response = "안녕하세요! 더 친해지고 싶어요!";
        break;
      case 3:
        response = "우리 이제 좋은 친구가 되었네요!";
        break;
      case 4:
        response = "항상 당신과 함께 있어서 행복해요~";
        break;
      case 5:
        response = "우리는 최고의 파트너예요! 앞으로도 함께해요!";
        break;
      default:
        response = "안녕하세요!";
    }

    res.json({
      message: response,
      appearance: CLOI_APPEARANCES[cloi.level]
    });
  } catch (error) {
    res.status(500).json({ message: '대화 처리 중 오류가 발생했습니다.', error: error.message });
  }
});

// 3. 클로이 성장 상태 업데이트
router.post('/:userId/growth/check', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 현재 게시물 및 댓글 수 조회
    const feedCount = await Feed.countDocuments({ 
      userId,
      status: 'active'
    });
    
    const commentCount = await Comment.countDocuments({
      userId,
      status: 'active'
    });

    // 새로운 레벨 계산
    const newLevel = calculateLevel(feedCount, commentCount);

    // 클로이 정보 업데이트
    const cloi = await Cloi.findOne({ userId });
    const previousLevel = cloi ? cloi.level : 1;

    const updatedCloi = await Cloi.findOneAndUpdate(
      { userId },
      { 
        level: newLevel,
        feedCount,
        commentCount,
        lastInteractionAt: new Date()
      },
      { new: true, upsert: true }
    );

    // 레벨업 여부 확인
    const hasLeveledUp = newLevel > previousLevel;

    // 레벨업했을 경우 알림 보내기
    if (hasLeveledUp) {
      await notificationService.sendCloiLevelUp(userId, newLevel);
    }

    res.json({
      cloi: updatedCloi,
      appearance: CLOI_APPEARANCES[newLevel],
      growth: {
        feedCount,
        commentCount,
        previousLevel,
        currentLevel: newLevel,
        hasLeveledUp,
        nextLevelProgress: calculateProgress(feedCount, commentCount, newLevel)
      }
    });
  } catch (error) {
    res.status(500).json({ message: '성장 상태 업데이트 중 오류가 발생했습니다.', error: error.message });
  }
});

// 다음 레벨까지 진행률 계산 함수
function calculateProgress(feedCount, commentCount, currentLevel) {
  const totalPoints = feedCount * 2 + commentCount;
  const levelThresholds = [0, 10, 20, 30, 50];
  
  if (currentLevel >= 5) return 100;
  
  const currentThreshold = levelThresholds[currentLevel - 1];
  const nextThreshold = levelThresholds[currentLevel];
  const progress = ((totalPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  
  return Math.min(Math.max(progress, 0), 100);
}

module.exports = router;