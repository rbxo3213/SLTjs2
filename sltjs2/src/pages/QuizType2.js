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
import { motion, AnimatePresence } from "framer-motion"; // 애니메이션을 위한 framer-motion 추가
import "./Quiz.css";

function QuizType2() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [submittedAnswer, setSubmittedAnswer] = useState("");
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const [isCorrect, setIsCorrect] = useState(null);

  const [translationResult, setTranslationResult] = useState("");
  const [gestureStartTime, setGestureStartTime] = useState(null);
  const [autoSubmitTriggered, setAutoSubmitTriggered] = useState(false);
  const [countdown, setCountdown] = useState(10); // 타이머 초기화 (10초)

  const GESTURE_THRESHOLD = 2000; // 2초
  const TOTAL_TIME = 10000; // 10초

  // 마운트 상태를 추적하기 위한 ref
  const isMounted = useRef(true);

  useEffect(() => {
    // 컴포넌트가 마운트될 때
    isMounted.current = true;

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

    return () => {
      // 컴포넌트가 언마운트될 때
      isMounted.current = false;
    };
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
        if (data.result && isMounted.current) {
          // 마운트 상태 확인
          const currentGesture = data.result.trim().toLowerCase();

          setTranslationResult(currentGesture);
          setUserAnswer(currentGesture);
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
      selfieMode: false, // selfieMode를 false로 설정
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
            if (
              isMounted.current &&
              webcamRef.current &&
              webcamRef.current.video
            ) {
              await handsRef.current.send({ image: webcamRef.current.video });
            }
          },
          width: 640, // 해상도 감소
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
                if (
                  isMounted.current &&
                  webcamRef.current &&
                  webcamRef.current.video
                ) {
                  await handsRef.current.send({
                    image: webcamRef.current.video,
                  });
                }
              },
              width: 640, // 해상도 감소
              height: 480,
            });
            cameraRef.current.start();
          }
        }, 100);
      }
    };

    initializeCamera();

    return () => {
      // 클린업
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null; // 참조 제거
      }
    };
  }, []);

  const onResults = (results) => {
    if (!isMounted.current) return; // 마운트 상태 확인

    const canvasElement = canvasRef.current;
    if (!canvasElement) return; // 캔버스 존재 여부 확인

    const videoElement = webcamRef.current.video;
    if (!videoElement) return; // 비디오 존재 여부 확인

    // 비디오 크기에 맞춰 캔버스 크기 설정
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    const canvasCtx = canvasElement.getContext("2d");
    if (!canvasCtx) return; // 캔버스 컨텍스트 존재 여부 확인

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
        socketRef.current.readyState === WebSocket.OPEN &&
        isMounted.current // 마운트 상태 확인
      ) {
        socketRef.current.send(landmarksString);
      } else {
        console.error(
          "WebSocket connection is not open or component unmounted."
        );
      }
    }
  };

  const checkAnswer = () => {
    const trimmedUserAnswer = userAnswer.trim().toLowerCase();
    const correctAnswer = questions[currentQuestion].trim().toLowerCase();
    console.log(
      "Comparing userAnswer:",
      trimmedUserAnswer,
      "with correctAnswer:",
      correctAnswer
    );

    setSubmittedAnswer(trimmedUserAnswer);

    if (trimmedUserAnswer === correctAnswer) {
      setScore(score + 1);
      setIsCorrect(true);
    } else {
      setIsCorrect(false);
    }
    setShowAnswer(true);
    setAutoSubmitTriggered(false); // 수동 제출 시 자동 제출 트리거 해제
  };

  const handleNext = () => {
    setUserAnswer("");
    setTranslationResult("");
    setSubmittedAnswer("");
    setShowAnswer(false);
    setIsCorrect(null);
    setGestureStartTime(null);
    setAutoSubmitTriggered(false);
    setCountdown(10); // 타이머 초기화

    if (currentQuestion + 1 < 10) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      saveScore(score, "QuizType2");
      navigate("/quiz-result", { state: { score, type: "QuizType2" } });
    }
  };

  // 타이머 및 자동 제출 로직
  useEffect(() => {
    if (questions.length === 0 || showAnswer) return;

    const timerInterval = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown > 0) return prevCountdown - 1;
        else return 0;
      });
    }, 1000); // 1초마다 카운트다운

    const gestureInterval = setInterval(() => {
      if (userAnswer) {
        if (gestureStartTime) {
          const elapsed = Date.now() - gestureStartTime;
          if (elapsed >= GESTURE_THRESHOLD && !autoSubmitTriggered) {
            // 2초 이상 동일한 제스처가 인식되었을 때 자동 제출
            setAutoSubmitTriggered(true);
            checkAnswer();
          }
        } else {
          setGestureStartTime(Date.now());
        }
      } else {
        setGestureStartTime(null);
      }
    }, 100); // 100ms마다 제스처 인식 시간 확인

    if (countdown === 0 && !showAnswer && !autoSubmitTriggered) {
      // 시간 초과 시 자동 제출 (오답 처리)
      checkAnswer();
    }

    return () => {
      clearInterval(timerInterval);
      clearInterval(gestureInterval);
    };
  }, [
    userAnswer,
    gestureStartTime,
    showAnswer,
    autoSubmitTriggered,
    countdown,
    questions.length,
  ]);

  // 자동 제출 시 타이머를 멈추기
  useEffect(() => {
    if (autoSubmitTriggered) {
      setCountdown((prev) => prev); // 현재 카운트다운 유지
    }
  }, [autoSubmitTriggered]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        if (showAnswer) {
          handleNext();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showAnswer, currentQuestion, score, userAnswer]);

  if (questions.length === 0) {
    return <div className="quiz-container">로딩 중...</div>;
  }

  return (
    <div className="quiz-container">
      <h2 className="quiz-header">지문자 동작 퀴즈</h2>
      <div className="progress-bar">
        <div
          className="progress"
          style={{ width: `${((currentQuestion + 1) / 10) * 100}%` }}
        ></div>
      </div>
      <div className="timer-container">
        <p className="timer-text">남은 시간: {countdown}초</p>
        <div className="timer-bar">
          <div
            className="timer-progress"
            style={{ width: `${(countdown / 10) * 100}%` }}
          ></div>
        </div>
      </div>
      <p className="quiz-subheader">문제 {currentQuestion + 1} / 10</p>
      <p className="quiz-subheader">
        다음 글자에 해당하는 수어 동작을 취해주세요:{" "}
        <span className="quiz-question">{questions[currentQuestion]}</span>
      </p>
      <div className="webcam-container">
        <Webcam
          ref={webcamRef}
          style={{
            width: "100%",
            height: "auto",
            transform: "scaleX(-1)", // 비디오 미러링
          }}
          videoConstraints={{
            facingMode: "user",
          }}
        />
        <canvas ref={canvasRef} className="output_canvas"></canvas>
      </div>
      <AnimatePresence>
        {showAnswer ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
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
            <p className="answer-details">
              당신의 답변: <strong>{submittedAnswer}</strong> / 정답:{" "}
              <strong>{questions[currentQuestion]}</strong>
            </p>
            <button onClick={handleNext} className="quiz-button">
              다음 문제
            </button>
            <p className="instruction">
              Enter 키를 눌러 다음 문제로 넘어갑니다.
            </p>
          </motion.div>
        ) : (
          <motion.button
            onClick={checkAnswer}
            className="quiz-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            답안 제출
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default QuizType2;
