// // services/notificationService.js
// const { User } = require('../models');
// const admin = require('../config/firebase');

// class NotificationService {
//   // 알림 전송 기본 함수
//   async sendNotification(data) {
//     try {
//       const { userId, title, body, type, triggeredBy } = data;
//       const recipient = await User.findOne({ userId });

//       // 데이터베이스에 알림 저장
//       const notification = await new Notification({
//         userId,
//         triggeredBy,
//         message: body,
//         type
//       }).save();

//       // FCM 토큰이 있는 디바이스 목록 가져오기
//       const fcmTokens = recipient.tokens
//         .filter(t => t.fcmToken)
//         .map(t => t.fcmToken);

//       if (fcmTokens.length > 0) {
//         const message = {
//           notification: {
//             title,
//             body
//           },
//           data: {
//             type,
//             notificationId: notification._id.toString(),
//             triggeredBy: triggeredBy || '',
//             createdAt: notification.createdAt.toISOString()
//           }
//         };

//         if (fcmTokens.length === 1) {
//           message.token = fcmTokens[0];
//           await admin.messaging().send(message);
//         } else {
//           message.tokens = fcmTokens;
//           await admin.messaging().sendMulticast(message);
//         }
//       }

//       return notification;
//     } catch (error) {
//       console.error('Error sending notification:', error);
//       throw error;
//     }
//   }

//   // 1. 클로이 일일 인사 알림
//   async sendCloiDailyGreeting(userId, level) {
//     const greetings = {
//       1: "안녕하세요! 오늘도 힘차게 시작해볼까요?",
//       2: "좋은 아침이에요! 오늘도 행복한 하루 되세요~",
//       3: "새로운 하루가 시작됐어요! 기분 좋은 일만 가득하길 바라요!",
//       4: "오늘도 멋진 하루를 보내세요! 당신과 함께여서 행복해요!",
//       5: "새로운 아침이 밝았어요! 우리 오늘도 힘내서 가보자고요!"
//     };

//     return this.sendNotification({
//       userId,
//       title: "클로이의 아침 인사",
//       body: greetings[level] || greetings[1],
//       type: 'cloi_greeting'
//     });
//   }

//   // 2. 클로이 레벨업 알림
//   async sendCloiLevelUp(userId, newLevel) {
//     const messages = {
//       2: "우와! 레벨 2가 되었어요! 조금씩 말도 늘어나고 있어요!",
//       3: "축하해요! 레벨 3으로 성장했어요! 이제 더 많은 대화를 나눌 수 있어요!",
//       4: "레벨 4까지 성장했어요! 정말 자랑스러워요!",
//       5: "드디어 최고 레벨 5에 도달했어요! 여기까지 함께해주셔서 감사해요!"
//     };

//     return this.sendNotification({
//       userId,
//       title: "클로이가 성장했어요! 🎉",
//       body: messages[newLevel],
//       type: 'level_up'
//     });
//   }

//   // 3. 댓글 알림
//   async sendCommentNotification(postAuthorId, commentAuthorId, postId) {
//     const commentAuthor = await User.findOne({ userId: commentAuthorId });
    
//     return this.sendNotification({
//       userId: postAuthorId,
//       triggeredBy: commentAuthorId,
//       title: "새로운 댓글",
//       body: `${commentAuthor.nickname}님이 회원님의 게시물에 댓글을 남겼습니다.`,
//       type: 'comment',
//       data: { postId }
//     });
//   }

//   // 4. 친구 요청 알림
//   async sendFriendRequestNotification(toId, fromId) {
//     const requestUser = await User.findOne({ userId: fromId });

//     return this.sendNotification({
//       userId: toId,
//       triggeredBy: fromId,
//       title: "새로운 친구 요청",
//       body: `${requestUser.nickname}님이 친구 요청을 보냈습니다.`,
//       type: 'friend_request'
//     });
//   }

//   // 5. 친구 수락 알림
//   async sendFriendAcceptedNotification(toId, fromId) {
//     const acceptUser = await User.findOne({ userId: fromId });

//     return this.sendNotification({
//       userId: toId,
//       triggeredBy: fromId,
//       title: "친구 요청 수락",
//       body: `${acceptUser.nickname}님과 친구가 되었습니다!`,
//       type: 'friend_accepted'
//     });
//   }
// }

// module.exports = new NotificationService();