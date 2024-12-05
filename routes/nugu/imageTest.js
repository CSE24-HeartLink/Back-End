// test.js
const WebSocket = require("ws");
const ws = new WebSocket("ws://localhost:3000/api/nugu/websocket");

ws.on("open", () => {
  console.log("Test client connected");
  // 테스트 이미지 생성 요청 보내기
  ws.send(
    JSON.stringify({
      type: "NUGU_IMAGE_REQUEST", // 이 type으로 보내야 함
      prompt: "귀여운 강아지 이미지",
    })
  );
});

ws.on("message", (data) => {
  console.log("Received full data:", data.toString());
  console.log("Parsed data:", JSON.parse(data));
});
