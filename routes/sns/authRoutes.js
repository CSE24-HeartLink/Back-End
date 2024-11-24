const express = require("express");
const router = express.Router();
const { User } = require("../../models");
const auth = require("../../middleware/auth");

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

    // 이메일 중복 체크
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ message: "이미 존재하는 이메일입니다." });
    }

    // 닉네임 중복 체크
    const nicknameExists = await User.findOne({ nickname });
    if (nicknameExists) {
      return res.status(400).json({ message: "이미 존재하는 닉네임입니다." });
    }

    // 새 사용자 생성
    const user = new User({
      email: email.toLowerCase(),
      password,
      nickname,
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
