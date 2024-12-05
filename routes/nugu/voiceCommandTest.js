// voiceCommandTest.js
const WebSocket = require("ws");
const ws = new WebSocket("ws://localhost:3000/api/nugu/websocket");

ws.on("open", () => {
  console.log("테스트 클라이언트 연결됨");

  // 음성 명령 테스트
  const voiceCommand = {
    type: "VOICE_COMMAND",
    command: "피드 음성인식 켜줘",
  };

  console.log("음성 명령 전송:", voiceCommand);
  ws.send(JSON.stringify(voiceCommand));
});

ws.on("message", (data) => {
  console.log("서버 응답 원본:", data.toString());
  try {
    console.log("서버 응답 (파싱됨):", JSON.parse(data));
  } catch (error) {
    console.error("응답 파싱 오류:", error);
  }
});

ws.on("error", (error) => {
  console.error("웹소켓 에러:", error);
});

ws.on("close", () => {
  console.log("웹소켓 연결 종료");
});

// 10초 후 연결 종료
setTimeout(() => {
  ws.close();
  console.log("테스트 종료");
  process.exit(0);
}, 10000);
