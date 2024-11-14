// server_word_translation.js

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
const pythonProcess = spawn(pythonExecutable, [
  path.join(__dirname, "ML", "word_recognizer_forweb.py"),
]);

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

// 클라이언트 연결 시 처리
wss.on("connection", (ws) => {
  console.log("Client connected.");

  ws.on("message", (message) => {
    console.log(`Received message from client: ${message}`);

    // 개행 문자 제거
    const messageString = message.toString().replace(/\n/g, "");

    // Python 프로세스에 메시지 전달
    pythonProcess.stdin.write(messageString + "\n", "utf8");

    // Python 프로세스의 출력 대기
    pythonProcess.stdout.once("data", (data) => {
      console.log(`Python script output: ${data}`);
      ws.send(data);
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected.");
  });
});
