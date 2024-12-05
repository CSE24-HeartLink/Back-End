const WebSocket = require("ws");
const ws = new WebSocket("ws://localhost:3000/api/nugu/websocket");

ws.on("open", () => {
  console.log("테스트 클라이언트 연결됨");

  const command = {
    type: "VOICE_COMMAND",
    command: "올려줘",
  };

  console.log("음성 명령 전송:", command);
  ws.send(JSON.stringify(command));
});

ws.on("message", (data) => {
  console.log("서버 응답:", data.toString());
  try {
    console.log("파싱된 응답:", JSON.parse(data));
  } catch (error) {
    console.error("응답 파싱 오류:", error);
  }
});

setTimeout(() => {
  ws.close();
  console.log("테스트 종료");
  process.exit(0);
}, 5000);
