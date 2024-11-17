const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { User } = require('../models');

// 회원가입
router.post("/signup", async (req, res) => {
    try {
      const { email, password, nickname } = req.body;
      const device = req.headers["user-agent"] || "unknown";
  
      // 필수 필드 체크
      if (!email || !password || !nickname) {
        return res.status(400).json({
          message: "이메일, 비밀번호, 닉네임은 필수입니다.",
        });
      }
  
      // 닉네임 유효성 검사 추가
      // 앞뒤 공백 제거하고 정규화
      const normalizedNickname = nickname.trim();
      
      // 빈 문자열 체크
      if (normalizedNickname.length === 0) {
        return res.status(400).json({
          message: "닉네임은 공백일 수 없습니다.",
        });
      }
  
      // 이메일 중복 체크
      const emailExists = await User.findOne({ 
        email: email.toLowerCase()
      });
      if (emailExists) {
        return res.status(400).json({ message: "이미 존재하는 이메일입니다." });
      }


      // 디버깅을 위한 로그 추가
      console.log('입력된 닉네임:', nickname);
      console.log('정규화된 닉네임:', normalizedNickname);

      // 정규식 패턴을 문자열로 출력해보기
      const regexPattern = `^${normalizedNickname}$`;
      console.log('정규식 패턴:', regexPattern);

      // 기존 쿼리를 좀 더 엄격하게 수정
      const nicknameExists = await User.findOne({
      nickname: normalizedNickname  // 정규식 대신 정확한 문자열 매칭으로 변경
      });

      console.log('DB 검색 결과:', nicknameExists);

      if (nicknameExists) {
      return res.status(400).json({ message: "이미 존재하는 닉네임입니다." });
      }
  
      // 새 사용자 생성
      const user = new User({
        email: email.toLowerCase(),
        password,
        nickname: normalizedNickname // 정규화된 닉네임 사용
      });
  
      await user.save();
  
      const token = await user.generateAuthToken(device);
  
      res.status(201).json({
        user: {
          email: user.email,
          nickname: user.nickname,
        },
        token,
      });
    } catch (error) {
      console.error("Signup error:", error);
      // 에러 로깅 추가
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        keyPattern: error.keyPattern
      });
  
      // MongoDB 중복 키 에러 처리
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          message: `이미 존재하는 ${
            field === "email" ? "이메일" : "닉네임"
          }입니다.`,
        });
      }
  
      res.status(500).json({
        message: "서버 에러가 발생했습니다.",
        error: error.message,
      });
    }
  });

// // 테스트용: 특정 닉네임으로 사용자 검색
// router.get('/auth/test/findByNickname', async (req, res) => {
//     try {
//       const { nickname } = req.query;
//       console.log('검색할 닉네임:', nickname);
      
//       const exactMatch = await User.findOne({ nickname: nickname });
//       const regexMatch = await User.findOne({
//         nickname: { $regex: new RegExp(`^${nickname}$`, 'i') }
//       });
      
//       res.json({
//         searchNickname: nickname,
//         exactMatch: !!exactMatch,
//         regexMatch: !!regexMatch,
//         exactMatchData: exactMatch,
//         regexMatchData: regexMatch
//       });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   });

// // authRoutes.js에 테스트 라우트 수정
// router.get('/test/users', async (req, res) => {
//     try {
//       const users = await User.find({}, 'email nickname tokens'); // nickname 필드 추가
//       res.json({ users });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   });

// // 테스트용 라우트 추가
// router.delete('/test/users', async (req, res) => {
//     try {
//       await User.deleteMany({});
//       res.json({ message: "모든 사용자 데이터가 삭제되었습니다." });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   });



router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const device = req.headers["user-agent"] || "unknown";

    console.log("Login attempt:", { email }); // 로그 추가

    // 이메일로 사용자 찾기
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log("User not found"); // 로그 추가
      return res
        .status(401)
        .json({ message: "이메일 또는 비밀번호가 잘못되었습니다." });
    }

    // 비밀번호 확인
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log("Password mismatch"); // 로그 추가
      return res
        .status(401)
        .json({ message: "이메일 또는 비밀번호가 잘못되었습니다." });
    }

    // 토큰 생성
    const token = await user.generateAuthToken(device);

    console.log("Login successful"); // 로그 추가

    // 회원가입 응답 형식과 동일하게 맞추기
    res.status(200).json({
      user: {
        email: user.email,
        nickname: user.nickname,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "로그인 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

// 로그아웃
router.post("/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    await req.user.save();
    res.json({ message: "로그아웃되었습니다." });
  } catch (error) {
    res.status(500).json({
      message: "서버 에러가 발생했습니다.",
      error: error.message,
    });
  }
});

module.exports = router;



// // routes/authRoutes.js
// const express = require('express');
// const router = express.Router();

// // 임시 로그인 라우트
// router.post('/login', (req, res) => {
//     res.json({ message: '로그인 성공 (테스트용)', userId: 'test123' });
// });

// // 임시 회원가입 라우트
// router.post('/register', (req, res) => {
//     res.json({ message: '회원가입 성공 (테스트용)', userId: 'test123' });
// });

// // 임시 로그아웃 라우트
// router.post('/logout', (req, res) => {
//     res.json({ message: '로그아웃 성공 (테스트용)' });
// });

// module.exports = router;