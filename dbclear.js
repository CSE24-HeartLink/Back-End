require("dotenv").config();
const mongoose = require("mongoose");

const clearDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB 연결됨");

    const collections = await mongoose.connection.db.collections();

    for (const collection of collections) {
      await collection.deleteMany({});
      console.log(`${collection.collectionName} 컬렉션 데이터 삭제 완료`);
    }

    console.log("모든 데이터 삭제 완료!");
  } catch (error) {
    console.error("에러 발생:", error);
  } finally {
    await mongoose.disconnect();
  }
};

clearDB();
