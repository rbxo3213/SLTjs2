const WebSocket = require("ws");
const { spawn } = require("child_process");
const path = require("path");

// 플랫폼에 따른 Python 실행 파일 결정
const isWindows = process.platform === "win32";
const pythonExecutable = isWindows ? "python" : "python3";

// WebSocket 서버 생성
const wss = new WebSocket.Server({ port: 8082 });

console.log("WebSocket server is running on ws://localhost:8082");

// Python 프로세스 시작
const pythonProcess = spawn(
  pythonExecutable,
  [path.join(__dirname, "ML", "word_recognizer_forweb.py")],
  {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  }
);

console.log("Python process started for word_recognizer_forweb.py");

pythonProcess.stdout.setEncoding("utf8");
pythonProcess.stderr.setEncoding("utf8");

// 에러 핸들링
pythonProcess.stderr.on("data", (data) => {
  console.error(`Python script error: ${data}`);
});

pythonProcess.on("close", (code) => {
  console.log(`Python process exited with code ${code}`);
});

// 요청 ID와 WebSocket 매핑을 위한 객체
const pendingRequests = {};

// 클라이언트 연결 시 처리
wss.on("connection", (ws) => {
  console.log("Client connected.");

  ws.on("message", (message) => {
    console.log(`Received message from client: ${message}`);

    // 메시지 파싱
    const messageData = JSON.parse(message);
    const requestId = messageData.id;

    // 요청 ID와 WebSocket 저장
    pendingRequests[requestId] = ws;

    // Python 프로세스에 메시지 전달
    pythonProcess.stdin.write(JSON.stringify(messageData) + "\n", "utf8");
  });

  ws.on("close", () => {
    console.log("Client disconnected.");
  });
});

// Python 프로세스의 출력 처리
pythonProcess.stdout.on("data", (data) => {
  console.log(`Python script output: ${data}`);
  try {
    const responseData = JSON.parse(data);
    const requestId = responseData.id;

    const client = pendingRequests[requestId];
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(responseData));
      // 요청 완료 후 삭제
      delete pendingRequests[requestId];
    }
  } catch (err) {
    console.error("Error parsing Python script output:", err);
  }
});
