// models/index.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//user schema
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "이메일은 필수 입력값입니다."],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "비밀번호는 필수 입력값입니다."],
      minlength: [6, "비밀번호는 최소 6자 이상이어야 합니다."],
    },
    nickname: {
      type: String,
      required: [true, "닉네임은 필수 입력값입니다."],
      unique: true,
      trim: true,
    },
    // 사용자의 여러 기기에서의 로그인 토큰을 저장
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
        device: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// MongoDB 인덱스 설정
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ nickname: 1 }, { unique: true });

// 비밀번호 암호화 미들웨어
// 사용자 정보 저장 전에 자동으로 실행됨
userSchema.pre("save", async function (next) {
  const user = this;
  // 비밀번호가 변경될 때만 암호화 수행
  if (user.isModified("password")) {
    // bcrypt.hash(평문비밀번호, 솔트라운드)
    // 솔트라운드 8: 8번의 해싱을 수행. 높을수록 보안성 증가but속도 감소
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

// JWT 토큰 생성 메서드
userSchema.methods.generateAuthToken = async function (device) {
  const user = this;

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET이 설정되지 않았습니다.");
  }

  try {
    // jwt.sign(payload, secret, options)
    // payload: 토큰에 포함될 데이터 (여기서는 사용자 ID)
    // secret: 토큰 서명에 사용될 비밀키
    // expiresIn: 토큰 만료 시간 (7일)
    const token = jwt.sign(
      { userId: user._id.toString() }, //_id를 userId로 변경
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 생성된 토큰을 사용자 문서에 저장
    user.tokens = user.tokens || [];
    user.tokens.push({ token, device });
    await user.save();

    return token;
  } catch (error) {
    throw new Error("토큰 생성에 실패했습니다: " + error.message);
  }
};

// 비밀번호 비교 메서드
userSchema.methods.comparePassword = async function (password) {
  try {
    // bcrypt.compare(입력된평문비밀번호, 저장된해시비밀번호)
    // 입력된 비밀번호를 해싱하여 저장된 해시와 비교
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw new Error("비밀번호 비교에 실패했습니다.");
  }
};

//Feed Schema
const feedSchema = new Schema({
  feedId: { type: String, required: true, unique: true },
  userId: {
    type: Schema.Types.String,
    required: true,
    ref: "User",
  },
  content: { type: String, required: true },
  groupId: String,
  emotion: String,
  images: [{ url: String, isAIGenerated: Boolean }],
  status: { type: String, default: "active" },
  commentCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 인덱스 추가
feedSchema.index({ feedId: 1 });
feedSchema.index({ userId: 1 });
feedSchema.index({ groupId: 1 });
feedSchema.index({ status: 1 });

//Comment Schema
const commentSchema = new Schema({
  commentId: { type: String, unique: true, required: true },
  feedId: { type: String, ref: "Feed", required: true },
  userId: { type: String, ref: "User", required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["active", "deleted"],
    default: "active",
  },
});

//Cloi Schema
const cloiSchema = new Schema({
  userId: { type: String, ref: "User", unique: true, required: true },
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 5,
  },
  feedCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  lastInteractionAt: { type: Date, default: Date.now },
});

//FriendList Schema
const friendListSchema = new Schema({
  userId: { type: String, ref: "User", required: true },
  friendId: { type: String, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["active", "deleted"],
    default: "active",
  },
});

//FriendRequest Schema
const friendRequestSchema = new Schema({
  fromId: { type: String, ref: "User", required: true },
  toId: { type: String, ref: "User", required: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

//GMember Schema
const gMemberSchema = new Schema({
  groupId: { type: String, ref: "Group", required: true },
  userId: { type: String, ref: "User", required: true },
  addedAt: { type: Date, default: Date.now },
});

//Group Schema
const groupSchema = new Schema({
  groupId: { type: String, unique: true, required: true },
  gName: {
    type: String,
    required: true,
    maxLength: 6,
  },
  createdBy: { type: String, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["active", "deleted"],
    default: "active",
  },
});

//Notification Schema
const notificationSchema = new Schema({
  userId: { type: String, ref: "User", required: true },
  triggeredBy: { type: String, ref: "User", required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["friend_request", "comment", "level_up", "etc"],
    required: true,
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Models 정의
const User = mongoose.model("User", userSchema);
const Feed = mongoose.model("Feed", feedSchema);
const Cloi = mongoose.model("Cloi", cloiSchema);
const Comment = mongoose.model("Comment", commentSchema);
const FriendList = mongoose.model("FriendList", friendListSchema);
const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);
const GMember = mongoose.model("GMember", gMemberSchema);
const Group = mongoose.model("Group", groupSchema);
const Notification = mongoose.model("Notification", notificationSchema);

module.exports = {
  User,
  Feed,
  Cloi,
  Comment,
  FriendList,
  FriendRequest,
  GMember,
  Group,
  Notification,
};
