const WebSocket = require("ws");
const axios = require("axios");

const { generateImage } = require("../ai/imageService");

function setupWebSocket(wss) {
  wss.on("connection", async (ws, req) => {
    console.log("새 웹소켓 연결, client address:", req.socket.remoteAddress);

    ws.clientId = Math.random().toString(36).substring(7);
    console.log("할당된 클라이언트 ID:", ws.clientId);

    ws.send(JSON.stringify({ type: "TEST_CONNECTION", clientId: ws.clientId }));

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);
        console.log(`클라이언트 ${ws.clientId}로부터 메시지 수신:`, data);

        if (data.type === "NUGU_IMAGE_REQUEST") {
          const generatedImage = await generateImage(data.prompt);

          wss.clients.forEach((client) => {
            console.log("전송 시도 - 클라이언트 ID:", client.clientId);
            if (client.readyState === 1) {
              client.send(
                JSON.stringify({
                  type: "AI_IMAGE_GENERATED",
                  data: [generatedImage],
                })
              );
            }
          });
          console.log("이미지 데이터 브로드캐스트 완료");
        }

        // 음성 명령 처리 추가
        if (data.type === "VOICE_COMMAND") {
          console.log("음성 명령 수신:", data.command);
          // 모든 클라이언트에게 전달
          wss.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(
                JSON.stringify({
                  type: "VOICE_COMMAND",
                  command: data.command,
                })
              );
            }
          });
          console.log("음성 명령 브로드캐스트 완료");
        }
      } catch (error) {
        console.error("메시지 처리 오류:", error);
      }
    });
  });
}

module.exports = setupWebSocket;
