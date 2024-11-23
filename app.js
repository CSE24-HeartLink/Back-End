// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");

require('./models');
const cron = require('node-cron');
const notificationService = require('./services/notificationService');
const authRoutes = require('./routes/authRoutes');
const notifyRoutes = require('./routes/notifyRoutes');
const feedRoutes = require('./routes/feedRoutes');
const groupRoutes = require('./routes/groupRoutes');
const cloiRoutes = require('./routes/cloiRoutes');
const friendRoutes = require('./routes/friendRoutes');
const albumRoutes = require('./routes/albumRoutes');
const profileRoutes = require('./routes/profileRoutes');
const { S3Client } = require("@aws-sdk/client-s3");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      family: 4
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// AWS S3 클라이언트 초기화
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

// 클로이 데일리 인사 크론 설정
cron.schedule('0 9 * * *', async () => {
  try {
    console.log('클로이 데일리 인사를 시작하는 중...');
    const Cloi = mongoose.model('Cloi');
    const clois = await Cloi.find();
    for (const cloi of clois) {
      await notificationService.sendCloiDailyGreeting(cloi.userId, cloi.level);
    }
    console.log(`Sent greetings to ${clois.length} Clois`);
  } catch (error) {
    console.error('Error sending daily greetings:', error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Seoul"
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notify', notifyRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/group', groupRoutes);
app.use('/api/cloi', cloiRoutes);
app.use('/api/friend', friendRoutes);
app.use('/api/album', albumRoutes);
app.use('/api/profile', profileRoutes);

// 서버 시작
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server initialization error:', error);
    process.exit(1);
  }
};

startServer();

// module.exports 제거