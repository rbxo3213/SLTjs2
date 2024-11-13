// src/pages/QuizType2.js

import React, { useState, useEffect, useRef } from "react";
import { letters } from "../data/letters";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { saveScore } from "../utils/scoreUtils";
import Webcam from "react-webcam";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import "./Quiz.css";

function QuizType2() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [submittedAnswer, setSubmittedAnswer] = useState(""); // 추가된 부분
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const [isCorrect, setIsCorrect] = useState(null);

  const [translationResult, setTranslationResult] = useState("");
  const [prevGesture, setPrevGesture] = useState("");
  const [startTime, setStartTime] = useState(Date.now());
  const recognizeDelay = 1000;

  useEffect(() => {
    if (!auth.currentUser) {
      alert("로그인이 필요합니다.");
      navigate("/login");
    } else {
      const filteredLetters = letters.filter(
        (letter) => letter !== "spacing" && letter !== "backspace"
      );
      const shuffledLetters = filteredLetters.sort(() => 0.5 - Math.random());
      setQuestions(shuffledLetters.slice(0, 10));
    }
  }, [navigate]);

  useEffect(() => {
    // WebSocket 연결 및 Hands 초기화
    socketRef.current = new WebSocket("ws://localhost:8081");

    socketRef.current.onopen = () => {
      console.log("WebSocket connection established.");
    };

    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.result) {
          const currentGesture = data.result.trim(); // 공백 제거

          setTranslationResult(currentGesture);
          setUserAnswer(currentGesture); // 항상 userAnswer를 업데이트
          console.log("userAnswer set to:", currentGesture);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    // Hands 초기화
    handsRef.current = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    handsRef.current.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      selfieMode: true,
    });

    handsRef.current.onResults(onResults);

    // 웹캠 시작
    const initializeCamera = () => {
      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4
      ) {
        cameraRef.current = new Camera(webcamRef.current.video, {
          onFrame: async () => {
            await handsRef.current.send({ image: webcamRef.current.video });
          },
          width: 640,
          height: 480,
        });
        cameraRef.current.start();
      } else {
        const interval = setInterval(() => {
          if (
            webcamRef.current &&
            webcamRef.current.video &&
            webcamRef.current.video.readyState === 4
          ) {
            clearInterval(interval);
            cameraRef.current = new Camera(webcamRef.current.video, {
              onFrame: async () => {
                await handsRef.current.send({ image: webcamRef.current.video });
              },
              width: 640,
              height: 480,
            });
            cameraRef.current.start();
          }
        }, 100);
      }
    };

    initializeCamera();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, []);

  const onResults = (results) => {
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");

    // 캔버스 초기화
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // 이미지 그리기
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 5,
        });
        drawLandmarks(canvasCtx, landmarks, {
          color: "#FF0000",
          lineWidth: 2,
        });
      }
    }

    canvasCtx.restore();

    // 랜드마크 데이터를 WebSocket을 통해 전송
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0].map((landmark) => ({
        x: landmark.x,
        y: landmark.y,
        z: landmark.z,
      }));

      const landmarksString = JSON.stringify(landmarks).replace(/\n/g, "");

      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.send(landmarksString);
      } else {
        console.error("WebSocket connection is not open.");
      }
    }
  };

  const checkAnswer = () => {
    const trimmedUserAnswer = userAnswer.trim();
    const correctAnswer = questions[currentQuestion].trim();
    console.log(
      "Comparing userAnswer:",
      trimmedUserAnswer,
      "with correctAnswer:",
      correctAnswer
    );

    setSubmittedAnswer(trimmedUserAnswer); // 제출한 답변 저장

    if (trimmedUserAnswer === correctAnswer) {
      setScore(score + 1);
      setIsCorrect(true); // 정답
    } else {
      setIsCorrect(false); // 오답
    }
    setShowAnswer(true);
  };

  const handleNext = () => {
    setUserAnswer("");
    setTranslationResult("");
    setSubmittedAnswer(""); // 초기화
    setShowAnswer(false);
    setIsCorrect(null); // 정답 여부 초기화
    setPrevGesture("");
    if (currentQuestion + 1 < 10) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // 퀴즈 종료 시 점수 저장
      saveScore(score, "QuizType2");
      navigate("/quiz-result", { state: { score, type: "QuizType2" } });
    }
  };

  if (questions.length === 0) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="quiz-container">
      <h2>수어 동작 퀴즈</h2>
      <p>문제 {currentQuestion + 1} / 10</p>
      <p>
        다음 글자에 해당하는 수어 동작을 취해주세요:{" "}
        <span className="quiz-question">{questions[currentQuestion]}</span>
      </p>
      <div className="webcam-container">
        <Webcam
          ref={webcamRef}
          style={{ visibility: "hidden" }}
          width={640}
          height={480}
        />
        <canvas
          ref={canvasRef}
          className="output_canvas"
          width={640}
          height={480}
        ></canvas>
      </div>
      <p>인식된 수어: {translationResult}</p>
      {showAnswer ? (
        <div>
          {isCorrect ? (
            <div className="answer-feedback correct">
              <div className="icon">⭕</div>
              <p>정답입니다!</p>
            </div>
          ) : (
            <div className="answer-feedback incorrect">
              <div className="icon">❌</div>
              <p>오답입니다!</p>
            </div>
          )}
          <p>
            당신의 답변: {submittedAnswer} / 정답: {questions[currentQuestion]}
          </p>
          <button onClick={handleNext} className="quiz-button">
            다음 문제
          </button>
        </div>
      ) : (
        <button onClick={checkAnswer} className="quiz-button">
          답안 제출
        </button>
      )}
    </div>
  );
}

export default QuizType2;
