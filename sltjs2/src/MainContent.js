// src/MainContent.js

import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import HangulComposer from "./HangulComposer";
import { SiKakaotalk } from "react-icons/si";
import { useNavigate, useLocation } from "react-router-dom";

function MainContent() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const cameraRef = useRef(null); // 카메라 객체를 저장할 ref
  const handsRef = useRef(null); // Hands 객체를 저장할 ref

  const [translationResult, setTranslationResult] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [sentence, setSentence] = useState("");
  const sentenceRef = useRef(sentence);
  const [prevGesture, setPrevGesture] = useState("");
  const prevGestureRef = useRef(prevGesture);
  const [startTime, setStartTime] = useState(Date.now());
  const startTimeRef = useRef(startTime);
  const recognizeDelay = 1000;

  const hangulComposer = useRef(new HangulComposer()).current;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    sentenceRef.current = sentence;
  }, [sentence]);

  useEffect(() => {
    prevGestureRef.current = prevGesture;
  }, [prevGesture]);

  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  useEffect(() => {
    let isMounted = true;

    // Kakao SDK 초기화
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init("1e157e9fb7ac775d68ced205ece37f1f");
    }

    // WebSocket 연결
    socketRef.current = new WebSocket("ws://localhost:8081");

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

          if (currentGesture === prevGestureRef.current) {
            if (currentTime - startTimeRef.current > recognizeDelay) {
              setSentence((prevSentence) => {
                if (currentGesture === "spacing") {
                  hangulComposer.input(" ");
                } else if (currentGesture === "backspace") {
                  // 백스페이스 처리
                  hangulComposer.deleteLast();
                } else {
                  hangulComposer.input(currentGesture);
                }

                const composedSentence = hangulComposer.getResult();
                sentenceRef.current = composedSentence;
                return composedSentence;
              });

              startTimeRef.current = currentTime;
              prevGestureRef.current = "";
              setPrevGesture("");
            }
          } else {
            startTimeRef.current = currentTime;
            setStartTime(currentTime);

            prevGestureRef.current = currentGesture;
            setPrevGesture(currentGesture);
          }

          console.log("Received message:", currentGesture);
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

    // Hands 초기화 및 useRef에 저장
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

    const onResults = (results) => {
      if (!isMounted) return;

      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext("2d");

      // 캔버스 초기화
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      // 좌우 반전 설정
      canvasCtx.translate(canvasElement.width, 0);
      canvasCtx.scale(-1, 1);

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

      // 캔버스 상태 복원
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

    handsRef.current.onResults(onResults);

    // 웹캠이 로드되었는지 확인 후 카메라 시작
    const initializeCamera = () => {
      if (
        webcamRef.current &&
        webcamRef.current.video.readyState === 4 &&
        isMounted
      ) {
        cameraRef.current = new Camera(webcamRef.current.video, {
          onFrame: async () => {
            if (isMounted && webcamRef.current && webcamRef.current.video) {
              await handsRef.current.send({
                image: webcamRef.current.video,
              });
            }
          },
          width: 640,
          height: 480,
        });
        cameraRef.current.start();
      } else {
        // 웹캠이 아직 준비되지 않았을 경우, 일정 간격으로 확인 후 초기화
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
                  await handsRef.current.send({
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
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
    };
  }, [hangulComposer]);

  const shareToKakao = () => {
    if (window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init("1e157e9fb7ac775d68ced205ece37f1f"); // 실제 JavaScript 키로 교체하세요
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
            mirrored={true} // 좌우 반전 적용
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

      {/* 현재 인식중인 수어와 연결 상태 */}
      <div className="status-container">
        <p>현재 인식중인 수어: {translationResult}</p>
        <p>연결 상태: {connectionStatus}</p>
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

export default MainContent;
