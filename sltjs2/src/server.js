// server.js

const WebSocket = require("ws");
const { spawn } = require("child_process");
const path = require("path");
const express = require("express");
const axios = require("axios");
const admin = require("firebase-admin");
const cors = require("cors");

// Firebase Admin SDK 초기화
const serviceAccount = require("../config/FirebaseServiceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Express 앱 생성
const app = express();
app.use(cors());

// Kakao Login 엔드포인트
app.get("/kakaoLogin", async (req, res) => {
  const code = req.query.code;
  try {
    // 1. 인가 코드로 카카오 액세스 토큰 요청
    const tokenResponse = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          client_id: "948a66bda17743e1dc0445f6297a6f66", // 실제 REST API 키로 교체하세요
          redirect_uri: "http://localhost:3000/kakaoRedirect", // Redirect URI
          code: code,
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // 2. 액세스 토큰으로 카카오 사용자 정보 요청
    const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const kakaoUid = `kakao:${userResponse.data.id}`;
    const nickname = userResponse.data.properties?.nickname || "익명 사용자";

    // 3. Firebase Custom Token 생성 시 닉네임 포함
    const additionalClaims = {
      nickname: nickname,
    };
    const firebaseToken = await admin
      .auth()
      .createCustomToken(kakaoUid, additionalClaims);

    // 4. 클라이언트로 Firebase Custom Token 전달
    res.json({ firebaseToken });
  } catch (error) {
    console.error(
      "카카오 로그인 에러:",
      error.response ? error.response.data : error
    );
    res.status(500).json({ error: "카카오 로그인 에러" });
  }
});

// Express 서버 시작
app.listen(5000, () => {
  console.log("Express server started on port 5000");
});

// WebSocket 서버 생성
const wss = new WebSocket.Server({ port: 8081 });

console.log("WebSocket server is running on ws://localhost:8081");

// 기존 WebSocket 및 Python 프로세스 코드 유지

// 플랫폼에 따른 Python 실행 파일 결정
const isWindows = process.platform === "win32";
const pythonExecutable = isWindows ? "python" : "python3";

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
