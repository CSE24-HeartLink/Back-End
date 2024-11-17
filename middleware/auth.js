const jwt = require("jsonwebtoken");
const User = require("../models");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", ""); // 헤더에서 토큰 추출 (Bearer token 형식)
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // 토큰 검증
    // 해당 토큰을 가진 유저 찾기
    const user = await User.findById(decoded.userId);

    if (!user) throw new Error();

    // req 객체에 token과 user를 저장하여 다음 미들웨어에서 사용할 수 있게 함
    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "인증이 필요합니다." });
  }
};

module.exports = auth;