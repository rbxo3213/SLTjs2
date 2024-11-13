// src/MainContent.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import HangulComposer from "./HangulComposer";
import { SiKakaotalk } from "react-icons/si";

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

  useEffect(() => {
    sentenceRef.current = sentence;
  }, [sentence]);

  useEffect(() => {
    prevGestureRef.current = prevGesture;
  }, [prevGesture]);

  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  const onResults = useCallback(
    (results) => {
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
    },
    [] // 의존성 배열에 필요한 상태나 함수가 없으면 빈 배열
  );

  useEffect(() => {
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
                  if (prevSentence.length > 0) {
                    hangulComposer.deleteLast();
                    return prevSentence.slice(0, -1);
                  }
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
      // 재연결 시도 로직 추가 가능
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

    handsRef.current.onResults(onResults);

    // 웹캠이 로드되었는지 확인 후 카메라 시작
    const initializeCamera = () => {
      if (webcamRef.current && webcamRef.current.video.readyState === 4) {
        cameraRef.current = new Camera(webcamRef.current.video, {
          onFrame: async () => {
            await handsRef.current.send({ image: webcamRef.current.video });
          },
          width: 640,
          height: 480,
        });
        cameraRef.current.start();
      } else {
        // 웹캠이 아직 준비되지 않았을 경우, 일정 간격으로 확인 후 초기화
        const interval = setInterval(() => {
          if (webcamRef.current && webcamRef.current.video.readyState === 4) {
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
  }, [hangulComposer, onResults]);

  // 카카오톡 공유 함수 (현재는 기능 없음)
  const shareToKakao = () => {
    console.log("카카오톡 공유 버튼이 클릭되었습니다.");
    // 추후 구현 예정
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
    </main>
  );
}

export default MainContent;
