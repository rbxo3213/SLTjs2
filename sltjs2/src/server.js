// server.js

const WebSocket = require("ws");
const { spawn } = require("child_process");
const path = require("path");

// 플랫폼에 따른 Python 실행 파일 결정
const isWindows = process.platform === "win32";
const pythonExecutable = isWindows ? "python" : "python3";

// WebSocket 서버 생성
const wss = new WebSocket.Server({ port: 8081 });

console.log("WebSocket server is running on ws://localhost:8081");

// Python 프로세스 시작 (하나의 지속적인 프로세스로 유지)
const pythonProcess = spawn(pythonExecutable, [
  path.join(__dirname, "ML", "landmark_recognizer_forweb.py"),
]);

// 파이썬 프로세스가 시작되었을 때 로그 출력
console.log("Python process started for landmark_recognizer_forweb.py");

pythonProcess.stdout.setEncoding("utf8");
pythonProcess.stderr.setEncoding("utf8");

// 에러 핸들링
pythonProcess.stderr.on("data", (data) => {
  console.error(`Python script error: ${data}`);
});

pythonProcess.on("close", (code) => {
  console.log(`Python process exited with code ${code}`);
});

// 클라이언트 연결 시 처리
wss.on("connection", (ws) => {
  console.log("Client connected.");

  ws.on("message", (message) => {
    console.log(`Received message from client: ${message}`);

    // Buffer를 문자열로 변환
    const messageString = message.toString();

    // 개행 문자 제거
    const sanitizedMessage = messageString.replace(/\n/g, "");

    // Python 프로세스에 메시지 전달
    pythonProcess.stdin.write(sanitizedMessage + "\n", "utf8");

    // Python 프로세스의 출력 대기
    pythonProcess.stdout.once("data", (data) => {
      console.log(`Python script output: ${data}`);
      ws.send(data); // UTF-8 인코딩 유지
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected.");
  });
});
