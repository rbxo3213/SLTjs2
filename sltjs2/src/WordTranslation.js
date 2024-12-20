// src/WordTranslation.js

import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import {
  Holistic,
  POSE_CONNECTIONS,
  HAND_CONNECTIONS,
} from "@mediapipe/holistic";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { SiKakaotalk } from "react-icons/si";
import { useNavigate, useLocation } from "react-router-dom";
import CardSection from "./components/CardSection"; // CardSection 컴포넌트 임포트

function WordTranslation() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const cameraRef = useRef(null);
  const holisticRef = useRef(null);

  const [translationResult, setTranslationResult] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [sentence, setSentence] = useState("");
  const sentenceRef = useRef(sentence);
  const [lastAddedGesture, setLastAddedGesture] = useState("");
  const lastAddedGestureRef = useRef(lastAddedGesture);
  const [startTime, setStartTime] = useState(Date.now());
  const startTimeRef = useRef(startTime);
  const recognizeDelay = 2000; // 2초로 설정

  const navigate = useNavigate();
  const location = useLocation();

  // 유니크한 ID 생성을 위한 함수
  function generateUniqueId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  useEffect(() => {
    sentenceRef.current = sentence;
  }, [sentence]);

  useEffect(() => {
    lastAddedGestureRef.current = lastAddedGesture;
  }, [lastAddedGesture]);

  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  // Kakao SDK 초기화
  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init("1e157e9fb7ac775d68ced205ece37f1f");
      console.log("Kakao SDK initialized");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // WebSocket 연결
    socketRef.current = new WebSocket("ws://localhost:8082");

    socketRef.current.onopen = () => {
      console.log("WebSocket connection established.");
      setConnectionStatus("Connected");
    };

    socketRef.current.onmessage = (event) => {
      console.log("Received data from server:", event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.result) {
          const currentGesture = data.result;
          const currentTime = Date.now();

          // 번역 결과는 항상 업데이트
          setTranslationResult(currentGesture);

          if (currentGesture !== lastAddedGestureRef.current) {
            if (currentTime - startTimeRef.current > recognizeDelay) {
              setSentence((prevSentence) => {
                const newSentence = prevSentence + " " + currentGesture;
                sentenceRef.current = newSentence;
                return newSentence;
              });

              // 마지막으로 추가된 제스처 업데이트
              setLastAddedGesture(currentGesture);
              lastAddedGestureRef.current = currentGesture;

              // 시간 초기화
              startTimeRef.current = currentTime;
              setStartTime(currentTime);
            }
          } else {
            // 동일한 제스처일 경우 시간만 업데이트
            startTimeRef.current = currentTime;
            setStartTime(currentTime);
          }

          console.log("Received gesture:", currentGesture);
        } else if (data.error) {
          console.error("Received error from server:", data.error);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("Error");
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket connection closed.");
      setConnectionStatus("Disconnected");
    };

    // Holistic 초기화
    holisticRef.current = new Holistic({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
      },
    });

    holisticRef.current.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      selfieMode: false, // 좌우 반전 해제
    });

    const onResults = (results) => {
      if (!isMounted) return;

      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext("2d");

      // 캔버스 초기화
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      // 이미지 그리기 (좌우 반전 없음)
      canvasCtx.drawImage(
        results.image,
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );

      // 랜드마크 그리기
      if (results.poseLandmarks) {
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 2,
        });
      }

      if (results.leftHandLandmarks) {
        drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, {
          color: "#FF0000",
          lineWidth: 2,
        });
        drawLandmarks(canvasCtx, results.leftHandLandmarks, {
          color: "#FF0000",
          lineWidth: 1,
        });
      }

      if (results.rightHandLandmarks) {
        drawConnectors(
          canvasCtx,
          results.rightHandLandmarks,
          HAND_CONNECTIONS,
          {
            color: "#0000FF",
            lineWidth: 2,
          }
        );
        drawLandmarks(canvasCtx, results.rightHandLandmarks, {
          color: "#0000FF",
          lineWidth: 1,
        });
      }

      // 캔버스 상태 복원
      canvasCtx.restore();

      // 랜드마크 데이터를 서버로 전송
      const landmarksData = {
        id: generateUniqueId(), // 고유한 ID 추가
        poseLandmarks: results.poseLandmarks
          ? results.poseLandmarks.map((landmark) => ({
              x: landmark.x,
              y: landmark.y,
              z: landmark.z,
              visibility: landmark.visibility,
            }))
          : null,
        leftHandLandmarks: results.leftHandLandmarks
          ? results.leftHandLandmarks.map((landmark) => ({
              x: landmark.x,
              y: landmark.y,
              z: landmark.z,
            }))
          : null,
        rightHandLandmarks: results.rightHandLandmarks
          ? results.rightHandLandmarks.map((landmark) => ({
              x: landmark.x,
              y: landmark.y,
              z: landmark.z,
            }))
          : null,
      };

      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.send(JSON.stringify(landmarksData));
      } else {
        console.error("WebSocket connection is not open.");
      }
    };

    holisticRef.current.onResults(onResults);

    // 웹캠 초기화
    const initializeCamera = () => {
      if (
        webcamRef.current &&
        webcamRef.current.video.readyState === 4 &&
        isMounted
      ) {
        cameraRef.current = new Camera(webcamRef.current.video, {
          onFrame: async () => {
            if (isMounted && webcamRef.current && webcamRef.current.video) {
              await holisticRef.current.send({
                image: webcamRef.current.video,
              });
            }
          },
          width: 640,
          height: 480,
        });
        cameraRef.current.start();
      } else {
        const interval = setInterval(() => {
          if (
            webcamRef.current &&
            webcamRef.current.video.readyState === 4 &&
            isMounted
          ) {
            clearInterval(interval);
            cameraRef.current = new Camera(webcamRef.current.video, {
              onFrame: async () => {
                if (isMounted && webcamRef.current && webcamRef.current.video) {
                  await holisticRef.current.send({
                    image: webcamRef.current.video,
                  });
                }
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
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (holisticRef.current) {
        holisticRef.current.close();
        holisticRef.current = null;
      }
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
    };
  }, []);

  const shareToKakao = () => {
    if (window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init("1e157e9fb7ac775d68ced205ece37f1f");
      }

      const maxTextLength = 200;
      let message = `번역 결과: ${sentence}\n\nSLTjs2 웹사이트에서 수어를 번역한 메시지입니다.`;

      if (message.length > maxTextLength) {
        message = message.substring(0, maxTextLength - 3) + "...";
      }

      window.Kakao.Link.sendDefault({
        objectType: "text",
        text: message,
        link: {
          mobileWebUrl: "http://localhost:3000", // 실제 웹사이트 URL로 변경하세요
          webUrl: "http://localhost:3000", // 실제 웹사이트 URL로 변경하세요
        },
        buttonTitle: "웹사이트로 이동",
      });
    } else {
      alert("카카오 SDK를 로드하지 못했습니다.");
    }
  };

  return (
    <main className="main-content">
      <div className="content-container">
        {/* 웹캠 및 캔버스 박스 */}
        <div className="webcam-box">
          <Webcam
            ref={webcamRef}
            audio={false}
            width={480}
            height={480}
            screenshotFormat="image/jpeg"
            mirrored={false} // 좌우 반전 해제
            style={{ visibility: "hidden" }}
          />
          <canvas
            ref={canvasRef}
            className="output_canvas"
            width={480}
            height={480}
          ></canvas>
        </div>

        {/* 화살표와 레이블 */}
        <div className="arrow-container">
          <div className="arrow"></div>
          <div className="arrow-label"></div>
        </div>

        {/* 번역 결과 출력 박스 */}
        <div className="translation-box">
          <p className="result-text">{sentence}</p>
        </div>
      </div>

      {/* 현재 인식중인 동작과 연결 상태 */}
      <div className="status-container">
        <p>현재 인식중인 동작: {translationResult}</p>
        <p>연결 상태: {connectionStatus}</p>
      </div>

      {/* CardSection 컴포넌트 추가 */}
      <CardSection />

      {/* 카카오톡 공유 버튼과 복사 버튼을 화면 하단 우측에 고정 */}
      <div className="fixed-button-group">
        <button className="kakao-share-button" onClick={shareToKakao}>
          <SiKakaotalk className="icon" /> 카카오톡 공유
        </button>
        <button
          className="copy-button"
          onClick={() => {
            navigator.clipboard.writeText(sentence);
            alert("번역된 결과가 복사되었습니다.");
          }}
        >
          복사
        </button>
      </div>

      {/* 모드 전환 버튼 */}
      <div className="mode-switcher">
        <button
          onClick={() => {
            if (location.pathname !== "/finger-spelling") {
              navigate("/finger-spelling");
            }
          }}
          className={location.pathname === "/finger-spelling" ? "active" : ""}
        >
          지문자 모드
        </button>
        <button
          onClick={() => {
            if (location.pathname !== "/word-translation") {
              navigate("/word-translation");
            }
          }}
          className={location.pathname === "/word-translation" ? "active" : ""}
        >
          단어 번역 모드
        </button>
      </div>
    </main>
  );
}

export default WordTranslation;
