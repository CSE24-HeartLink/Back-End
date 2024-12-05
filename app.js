require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const cron = require("node-cron");
const { S3Client } = require("@aws-sdk/client-s3");

require("./models");
const notificationService = require("./services/notificationService");
const snsRoutes = require("./routes/sns");
const aiRoutes = require("./routes/ai");
const setupWebSocket = require("./routes/nugu/websocketRoutes");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,
      family: 4,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

cron.schedule(
  "0 9 * * *",
  async () => {
    try {
      console.log("Starting Cloi daily greetings...");
      const Cloi = mongoose.model("Cloi");
      const clois = await Cloi.find();
      for (const cloi of clois) {
        await notificationService.sendCloiDailyGreeting(
          cloi.userId,
          cloi.level
        );
      }
      console.log(`Sent greetings to ${clois.length} Clois`);
    } catch (error) {
      console.error("Error sending daily greetings:", error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Seoul",
  }
);

app.use("/api/sns", snsRoutes);
app.use("/api/ai", aiRoutes);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
setupWebSocket(wss);

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server initialization error:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
